/**
 * Ultralytics YOLO reader and writer (detect / segment / pose).
 *
 * Labels are normalised centre-form boxes (`cls cx cy w h`), or polygon points,
 * or keypoints, and carry no ids, areas or scores — that is why the loss table
 * is noisy for YOLO. Reading needs image dimensions to denormalise; the caller
 * supplies them through `ReadContext.imageSize`.
 */

import { parse as parseYaml } from 'yaml'

import { FILE_READ_CONCURRENCY, mapLimit } from '../concurrency'
import { bboxArea, bboxFromPoints, bboxToYoloBox, polygonArea, yoloBoxToBBox } from '../geometry'
import type {
  Annotation,
  BBox,
  Category,
  DatasetModel,
  ImageRecord,
  Keypoint,
  KeypointSchema,
  KpVisibility,
  Polygon,
} from '../model'
import { assignCategoryColors } from '../palette'
import { fileExtension, imagesPathToLabelsPath } from '../path'
import { IMAGE_EXTENSIONS, type DetectedFile } from './detect'
import type { OutputFile, ReadContext, ReadResult, WriteResult } from './types'

export type YoloTask = 'detect' | 'seg' | 'pose'

export interface YoloReadOptions extends ReadContext {
  files: DetectedFile[]
}

function readNames(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([, name]) => String(name))
  }
  return []
}

function toVisibility(value: number): KpVisibility {
  return value === 1 || value === 2 ? value : value > 0 ? 2 : 0
}

export async function readYolo(options: YoloReadOptions): Promise<ReadResult> {
  const warnings: string[] = []
  const yamlEntry = options.files.find(
    (entry) => !entry.isDir && ['.yaml', '.yml'].includes(fileExtension(entry.path)),
  )

  let names: string[] = []
  let kptShape: number[] | undefined
  let kptNames: string[] = []
  if (yamlEntry) {
    try {
      const data = parseYaml(await options.readText(yamlEntry.path)) as Record<
        string,
        unknown
      > | null
      if (data && typeof data === 'object') {
        names = readNames(data.names)
        if (Array.isArray(data.kpt_shape)) {
          kptShape = data.kpt_shape.map(Number)
        }
        if (Array.isArray(data.kpt_names)) {
          kptNames = data.kpt_names.map(String)
        }
      }
    } catch (error) {
      warnings.push(`${yamlEntry.path} could not be parsed: ${(error as Error).message}`)
    }
  }

  const poseNames =
    kptNames.length > 0
      ? kptNames
      : kptShape
        ? Array.from({ length: kptShape[0] }, (_, index) => `kp-${index}`)
        : []
  const schema: KeypointSchema | undefined = kptShape
    ? { names: poseNames, dims: kptShape[1] === 2 ? 2 : 3 }
    : undefined

  const imageFiles = options.files.filter(
    (entry) => !entry.isDir && IMAGE_EXTENSIONS.has(fileExtension(entry.path)),
  )

  // Labels are one small file per image, so read them with bounded concurrency
  // instead of paying a full round-trip per file in sequence.
  options.onProgress?.(0)
  const total = imageFiles.length
  let labelsRead = 0
  const labelTexts = await mapLimit(imageFiles, FILE_READ_CONCURRENCY, async (image) => {
    let text: string | null = null
    try {
      text = await options.readText(imagesPathToLabelsPath(image.path))
    } catch {
      text = null
    }
    labelsRead += 1
    options.onProgress?.((labelsRead / Math.max(1, total)) * 0.5)
    return text
  })

  // Only images that carry labels need their size — YOLO stores normalised
  // coordinates — so unlabelled images skip that round-trip entirely.
  const dims: ({ width: number; height: number } | null)[] = new Array(total).fill(null)
  if (options.imageSize) {
    const labelled = imageFiles
      .map((image, index) => ({ image, index }))
      .filter((entry) => (labelTexts[entry.index] ?? '').trim() !== '')
    let sized = 0
    await mapLimit(labelled, FILE_READ_CONCURRENCY, async (entry) => {
      dims[entry.index] = await options.imageSize!(entry.image.path)
      sized += 1
      options.onProgress?.(0.5 + (sized / Math.max(1, labelled.length)) * 0.5)
    })
  } else {
    options.onProgress?.(1)
  }

  const images: ImageRecord[] = []
  const annotations: Annotation[] = []
  // Remember which images had a label file, so a save can still clear a label
  // the user deleted (an empty file) without inventing files for images that
  // never had any.
  const labelledImageIds: number[] = []
  let maxClass = names.length - 1

  for (let imageId = 0; imageId < total; imageId += 1) {
    const image = imageFiles[imageId]
    const labelPath = imagesPathToLabelsPath(image.path)
    const text = labelTexts[imageId]
    const size = dims[imageId]
    images.push({
      id: imageId,
      filePath: image.path,
      width: size?.width ?? 0,
      height: size?.height ?? 0,
    })

    if (!text || text.trim() === '') {
      continue
    }
    labelledImageIds.push(imageId)
    if (!size) {
      warnings.push(`Could not determine the size of ${image.path}; its labels were skipped`)
      continue
    }
    const width = size.width
    const height = size.height

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (line === '') continue
      const tokens = line.split(/\s+/).map(Number)
      if (tokens.some((value) => !Number.isFinite(value))) {
        warnings.push(`${labelPath}: malformed line was skipped`)
        continue
      }

      const [classId, ...rest] = tokens
      maxClass = Math.max(maxClass, classId)

      if (kptShape && rest.length === 4 + kptShape[0] * kptShape[1]) {
        const [cx, cy, w, h, ...flat] = rest
        const box = yoloBoxToBBox(cx, cy, w, h, width, height)
        const stride = kptShape[1]
        const keypoints: Keypoint[] = []
        for (let i = 0; i + stride - 1 < flat.length; i += stride) {
          const name = poseNames[keypoints.length]
          keypoints.push({
            x: flat[i] * width,
            y: flat[i + 1] * height,
            v: stride === 3 ? toVisibility(flat[i + 2]) : 2,
            ...(name ? { name } : {}),
          })
        }
        annotations.push({
          type: 'keypoints',
          imageId,
          categoryId: classId,
          bbox: box,
          keypoints,
          numKeypoints: keypoints.filter((keypoint) => keypoint.v > 0).length,
          area: bboxArea(box),
        })
        continue
      }

      if (rest.length === 4) {
        const [cx, cy, w, h] = rest
        const box = yoloBoxToBBox(cx, cy, w, h, width, height)
        annotations.push({
          type: 'bbox',
          imageId,
          categoryId: classId,
          bbox: box,
          area: bboxArea(box),
        })
        continue
      }

      if (rest.length >= 6 && rest.length % 2 === 0) {
        const polygon: Polygon = []
        for (let i = 0; i < rest.length; i += 2) {
          polygon.push({ x: rest[i] * width, y: rest[i + 1] * height })
        }
        annotations.push({
          type: 'polygon',
          imageId,
          categoryId: classId,
          polygons: [polygon],
          bbox: bboxFromPoints(polygon),
          area: polygonArea(polygon),
        })
        continue
      }

      warnings.push(`${labelPath}: unrecognised label line was skipped`)
    }
  }

  const categories: Category[] = []
  for (let id = 0; id <= maxClass; id += 1) {
    categories.push({
      id,
      name: names[id] ?? `class-${id}`,
      ...(schema ? { keypointSchema: schema } : {}),
    })
  }

  const sourceFormat = schema
    ? 'yolo-pose'
    : annotations.some((annotation) => annotation.type === 'polygon')
      ? 'yolo-seg'
      : 'yolo'

  const dataset: DatasetModel = {
    sourceFormat,
    root: options.root,
    images,
    categories: assignCategoryColors(categories),
    annotations,
    classNames: categories.map((category) => category.name),
    origin: {
      ...(yamlEntry ? { yamlPath: yamlEntry.path } : {}),
      labelledImageIds,
    },
  }

  return { dataset, warnings }
}

function boxOf(annotation: Annotation): BBox | undefined {
  if (annotation.type === 'bbox') return annotation.bbox
  if (annotation.type === 'polygon' || annotation.type === 'mask') return annotation.bbox
  if (annotation.type === 'keypoints') return annotation.bbox
  return undefined
}

function formatYaml(names: string[], schema: KeypointSchema | undefined): string {
  const lines = ['path: .', 'names:']
  names.forEach((name, index) => {
    lines.push(`  ${index}: ${name}`)
  })
  if (schema) {
    lines.push(`kpt_shape: [${schema.names.length}, ${schema.dims}]`)
    if (schema.flipIdx) {
      lines.push(`flip_idx: [${schema.flipIdx.join(', ')}]`)
    }
  }
  return `${lines.join('\n')}\n`
}

export interface YoloWriteOptions {
  /** Path of the `data.yaml`. Defaults to `data.yaml` at the output root. */
  yamlPath?: string
  /** Override the label path for an image. Defaults to the `images/`→`labels/` rule. */
  pathFor?: (image: ImageRecord) => string
  /**
   * Whether to emit a (possibly empty) label file for an image that currently
   * has no annotations. Used by save so clearing an image's last label overwrites
   * the old file instead of leaving it stale.
   */
  emitEmptyFor?: (image: ImageRecord) => boolean
}

/** Serialise a dataset to YOLO label files plus a `data.yaml`. */
export function writeYolo(
  dataset: DatasetModel,
  task: YoloTask,
  options: YoloWriteOptions = {},
): WriteResult {
  const files: OutputFile[] = []
  const warnings: string[] = []

  const categories = [...dataset.categories].sort((a, b) => a.id - b.id)
  const classIndex = new Map(categories.map((category, index) => [category.id, index]))
  const names = categories.map((category) => category.name)
  const schema = categories.find((category) => category.keypointSchema)?.keypointSchema

  for (const image of dataset.images) {
    if (image.width <= 0 || image.height <= 0) {
      warnings.push(`Skipped ${image.filePath}: image size is unknown, so it cannot be normalised`)
      continue
    }
    const items = dataset.annotations.filter((annotation) => annotation.imageId === image.id)
    const lines: string[] = []

    for (const annotation of items) {
      const classId = classIndex.get(annotation.categoryId)
      if (classId === undefined) {
        continue
      }

      if (task === 'pose' && annotation.type === 'keypoints' && schema) {
        const box = bboxToYoloBox(annotation.bbox, image.width, image.height)
        const parts = [classId, box.xCenter, box.yCenter, box.width, box.height].map(round)
        schema.names.forEach((_, index) => {
          const keypoint = annotation.keypoints[index]
          if (!keypoint) {
            parts.push(0, 0, 0)
            return
          }
          parts.push(round(keypoint.x / image.width), round(keypoint.y / image.height), keypoint.v)
        })
        lines.push(parts.join(' '))
        continue
      }

      if (task === 'seg' && annotation.type === 'polygon') {
        for (const polygon of annotation.polygons) {
          const parts = [
            classId,
            ...polygon.flatMap((point) => [
              round(point.x / image.width),
              round(point.y / image.height),
            ]),
          ]
          lines.push(parts.join(' '))
        }
        continue
      }

      const box = boxOf(annotation)
      if (!box) {
        warnings.push(`Annotation of type "${annotation.type}" was skipped in YOLO output`)
        continue
      }
      const normalised = bboxToYoloBox(box, image.width, image.height)

      if (task === 'seg') {
        const corners = [
          { x: box.x, y: box.y },
          { x: box.x + box.width, y: box.y },
          { x: box.x + box.width, y: box.y + box.height },
          { x: box.x, y: box.y + box.height },
        ]
        const parts = [
          classId,
          ...corners.flatMap((point) => [
            round(point.x / image.width),
            round(point.y / image.height),
          ]),
        ]
        lines.push(parts.join(' '))
        continue
      }

      lines.push(
        [classId, normalised.xCenter, normalised.yCenter, normalised.width, normalised.height]
          .map(round)
          .join(' '),
      )
    }

    if (lines.length > 0 || options.emitEmptyFor?.(image) === true) {
      files.push({
        path: options.pathFor?.(image) ?? imagesPathToLabelsPath(image.filePath),
        contents: lines.length > 0 ? `${lines.join('\n')}\n` : '',
      })
    }
  }

  files.push({
    path: options.yamlPath ?? 'data.yaml',
    contents: formatYaml(names, task === 'pose' ? schema : undefined),
  })
  return { files, warnings }
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6
}
