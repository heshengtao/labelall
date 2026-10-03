/**
 * COCO (JSON) reader.
 *
 * The awkward parts of COCO, all handled here:
 * - `segmentation` is either an array of polygons OR an RLE object OR (from some
 *   exporters) a single flat polygon array. Dispatch on the runtime type, never
 *   on `iscrowd`.
 * - RLE `size` is `[height, width]` — the opposite order from everything else.
 * - `keypoints` is a flat `[x, y, v, …]` array where `v` is 0/1/2.
 * - `categories[].skeleton` uses 1-based indices while `categories[].keypoints`
 *   is a 0-based name array.
 * - `attributes` is not part of the core spec; pass it through untouched.
 */

import { bboxArea, bboxFromCorners, bboxFromPoints, polygonsArea } from '../geometry'
import type {
  Annotation,
  BBox,
  Category,
  DatasetModel,
  ImageRecord,
  Keypoint,
  KeypointSchema,
  KpVisibility,
  Mask,
  Polygon,
} from '../model'
import { assignCategoryColors } from '../palette'
import { fileBasename, joinPath } from '../path'
import type { OutputFile, ReadContext, ReadResult, WriteResult } from './types'

interface RawCocoImage {
  id: number
  file_name?: string
  width?: number
  height?: number
  license?: number
  coco_url?: string
  flickr_url?: string
  date_captured?: string
}

interface RawCocoCategory {
  id: number
  name: string
  supercategory?: string
  keypoints?: string[]
  skeleton?: number[][]
}

interface RawCocoRle {
  size: number[]
  counts: number[] | string
}

type RawSegmentation = number[][] | number[] | RawCocoRle | null

interface RawCocoAnnotation {
  id?: number
  image_id: number
  category_id: number
  bbox?: number[]
  area?: number
  iscrowd?: number
  segmentation?: RawSegmentation
  keypoints?: number[]
  num_keypoints?: number
  score?: number
  attributes?: Record<string, unknown>
}

interface RawCoco {
  info?: Record<string, unknown>
  licenses?: { id: number; name: string; url?: string }[]
  images?: RawCocoImage[]
  annotations?: RawCocoAnnotation[]
  categories?: RawCocoCategory[]
}

export interface CocoReadOptions extends ReadContext {
  /** Path of the annotation JSON, relative to the dataset root. */
  annotationPath: string
  /**
   * Directory holding the images, relative to the root. COCO's `file_name` is
   * relative to this directory. Defaults to the root itself.
   */
  imageDir?: string
  /** Split the images belong to, when known from the file name (e.g. train2017). */
  split?: string
}

function flatArrayToPolygon(values: readonly number[]): Polygon {
  const polygon: Polygon = []
  for (let i = 0; i + 1 < values.length; i += 2) {
    polygon.push({ x: values[i], y: values[i + 1] })
  }
  return polygon
}

function parseSegmentation(segmentation: RawSegmentation): Mask | null {
  if (!segmentation) {
    return null
  }

  if (Array.isArray(segmentation)) {
    if (segmentation.length === 0) {
      return null
    }
    const polygons: Polygon[] = []
    if (typeof segmentation[0] === 'number') {
      // Some exporters emit one flat polygon instead of an array of polygons.
      polygons.push(flatArrayToPolygon(segmentation as number[]))
    } else {
      for (const candidate of segmentation as number[][]) {
        if (Array.isArray(candidate) && candidate.length >= 6) {
          polygons.push(flatArrayToPolygon(candidate))
        }
      }
    }
    return polygons.length > 0 ? { encoding: 'polygon', polygons } : null
  }

  if (typeof segmentation === 'object' && 'counts' in segmentation && 'size' in segmentation) {
    const { size, counts } = segmentation
    if (!Array.isArray(size) || size.length !== 2) {
      return null
    }
    return { encoding: 'rle', size: [size[0], size[1]], counts }
  }

  return null
}

function toVisibility(value: number, warn: (message: string) => void, index: number): KpVisibility {
  if (value === 0 || value === 1 || value === 2) {
    return value
  }
  // Prediction exports put a confidence score in this slot instead of 0/1/2.
  warn(`keypoint ${index} had visibility ${value}; treated as ${value > 0 ? 2 : 0}`)
  return value > 0 ? 2 : 0
}

function readKeypointSchema(category: RawCocoCategory): KeypointSchema | undefined {
  const names = category.keypoints
  if (!Array.isArray(names) || names.length === 0) {
    return undefined
  }
  const skeleton = Array.isArray(category.skeleton)
    ? category.skeleton
        .filter((pair) => Array.isArray(pair) && pair.length === 2)
        .map((pair) => [pair[0], pair[1]] as [number, number])
    : undefined
  return {
    names: [...names],
    // Both dims are possible on disk; COCO's own format carries visibility.
    dims: 3,
    ...(skeleton && skeleton.length > 0 ? { skeleton } : {}),
  }
}

function toBBox(values: readonly number[] | undefined): BBox | null {
  if (!values || values.length < 4) {
    return null
  }
  const [x, y, width, height] = values
  if (![x, y, width, height].every((value) => Number.isFinite(value))) {
    return null
  }
  return bboxFromCorners(x, y, x + width, y + height)
}

export async function readCoco(options: CocoReadOptions): Promise<ReadResult> {
  const { annotationPath, imageDir = '', split } = options
  const warnings: string[] = []
  const warn = (message: string): void => {
    warnings.push(message)
  }

  const raw = JSON.parse(await options.readText(annotationPath)) as RawCoco

  if (!Array.isArray(raw.images)) {
    throw new Error(`${annotationPath} is not a COCO file: missing the "images" array`)
  }
  const rawAnnotations = Array.isArray(raw.annotations) ? raw.annotations : []
  if (!Array.isArray(raw.annotations)) {
    warn('COCO file has no "annotations" array; loaded images only')
  }

  const categories: Category[] = (raw.categories ?? []).map((category) => {
    const keypointSchema = readKeypointSchema(category)
    return {
      id: category.id,
      name: category.name,
      ...(category.supercategory ? { supercategory: category.supercategory } : {}),
      ...(keypointSchema ? { keypointSchema } : {}),
    }
  })

  const categoryById = new Map(categories.map((category) => [category.id, category]))

  const images: ImageRecord[] = []
  const imageIds = new Set<number>()
  for (const image of raw.images) {
    if (typeof image.file_name !== 'string' || image.file_name.length === 0) {
      warn(`image ${image.id} has no file_name and was skipped`)
      continue
    }
    if (imageIds.has(image.id)) {
      warn(`duplicate image id ${image.id}; later entry was skipped`)
      continue
    }
    imageIds.add(image.id)

    const source: Record<string, unknown> = {}
    if (image.license !== undefined) source.license = image.license
    if (image.coco_url) source.cocoUrl = image.coco_url
    if (image.flickr_url) source.flickrUrl = image.flickr_url
    if (image.date_captured) source.dateCaptured = image.date_captured

    images.push({
      id: image.id,
      filePath: joinPath(imageDir, image.file_name),
      fileName: fileBasename(image.file_name),
      width: image.width ?? 0,
      height: image.height ?? 0,
      ...(split ? { split } : {}),
      ...(Object.keys(source).length > 0 ? { source } : {}),
    })
  }

  const annotations: Annotation[] = []
  for (const rawAnnotation of rawAnnotations) {
    const category = categoryById.get(rawAnnotation.category_id)
    if (!category) {
      warn(
        `annotation ${rawAnnotation.id ?? '?'} references unknown category ${rawAnnotation.category_id} and was skipped`,
      )
      continue
    }
    if (!imageIds.has(rawAnnotation.image_id)) {
      warn(
        `annotation ${rawAnnotation.id ?? '?'} references unknown image ${rawAnnotation.image_id} and was skipped`,
      )
      continue
    }

    const bbox = toBBox(rawAnnotation.bbox)
    const mask = parseSegmentation(rawAnnotation.segmentation ?? null)
    const flags = rawAnnotation.iscrowd ? { iscrowd: true } : undefined

    const base = {
      ...(rawAnnotation.id !== undefined ? { id: rawAnnotation.id } : {}),
      imageId: rawAnnotation.image_id,
      categoryId: rawAnnotation.category_id,
      ...(rawAnnotation.score !== undefined ? { score: rawAnnotation.score } : {}),
      ...(rawAnnotation.attributes ? { attributes: rawAnnotation.attributes } : {}),
      ...(flags ? { flags } : {}),
    }

    const rawKeypoints = rawAnnotation.keypoints
    if (Array.isArray(rawKeypoints) && rawKeypoints.length >= 3) {
      const names = category.keypointSchema?.names ?? []
      const keypoints: Keypoint[] = []
      for (let i = 0; i + 2 < rawKeypoints.length; i += 3) {
        const index = keypoints.length
        const keypoint: Keypoint = {
          x: rawKeypoints[i],
          y: rawKeypoints[i + 1],
          v: toVisibility(rawKeypoints[i + 2], warn, index),
        }
        const name = names[index]
        if (name) {
          keypoint.name = name
        }
        keypoints.push(keypoint)
      }

      const labeled = keypoints.filter((keypoint) => keypoint.v > 0)
      const derivedBox = bbox ?? (labeled.length > 0 ? bboxFromPoints(labeled) : null)
      if (!derivedBox) {
        warn(
          `keypoint annotation ${rawAnnotation.id ?? '?'} has no bbox and no visible points; skipped`,
        )
        continue
      }

      annotations.push({
        ...base,
        type: 'keypoints',
        bbox: derivedBox,
        keypoints,
        numKeypoints:
          rawAnnotation.num_keypoints ?? keypoints.filter((keypoint) => keypoint.v > 0).length,
        area: rawAnnotation.area ?? bboxArea(derivedBox),
      })
      continue
    }

    if (mask?.encoding === 'polygon') {
      annotations.push({
        ...base,
        type: 'polygon',
        polygons: mask.polygons,
        ...(bbox ? { bbox } : {}),
        area: rawAnnotation.area ?? polygonsArea(mask.polygons),
      })
      continue
    }

    if (mask?.encoding === 'rle') {
      annotations.push({
        ...base,
        type: 'mask',
        mask,
        ...(bbox ? { bbox } : {}),
        // For iscrowd=1 the stored area is the mask area, NOT width*height.
        area: rawAnnotation.area ?? (bbox ? bboxArea(bbox) : 0),
      })
      continue
    }

    if (bbox) {
      annotations.push({
        ...base,
        type: 'bbox',
        bbox,
        area: rawAnnotation.area ?? bboxArea(bbox),
      })
      continue
    }

    warn(`annotation ${rawAnnotation.id ?? '?'} has no bbox or segmentation and was skipped`)
  }

  const dataset: DatasetModel = {
    sourceFormat: 'coco',
    root: options.root,
    images,
    categories: assignCategoryColors(categories),
    annotations,
    ...(raw.info ? { info: raw.info as DatasetModel['info'] } : {}),
    ...(Array.isArray(raw.licenses) ? { licenses: raw.licenses } : {}),
    classNames: categories.map((category) => category.name),
  }

  return { dataset, warnings }
}

function bboxArray(box: BBox): number[] {
  return [box.x, box.y, box.width, box.height]
}

export interface CocoWriteOptions {
  /** Where to write the JSON, relative to the output root. */
  path?: string
}

/** Serialise a dataset back to a single COCO JSON file. */
export function writeCoco(dataset: DatasetModel, options: CocoWriteOptions = {}): WriteResult {
  const warnings: string[] = []
  const path = options.path ?? 'annotations/instances.json'

  const categories = dataset.categories.map((category) => ({
    id: category.id,
    name: category.name,
    ...(category.supercategory ? { supercategory: category.supercategory } : {}),
    ...(category.keypointSchema
      ? {
          keypoints: category.keypointSchema.names,
          ...(category.keypointSchema.skeleton
            ? { skeleton: category.keypointSchema.skeleton }
            : {}),
        }
      : {}),
  }))

  const images = dataset.images.map((image) => ({
    id: image.id,
    file_name: image.filePath,
    width: image.width,
    height: image.height,
  }))

  const annotations: Record<string, unknown>[] = []
  for (const annotation of dataset.annotations) {
    if (annotation.type === 'classification') {
      warnings.push('Image-level class labels are skipped in COCO output')
      continue
    }

    const common = {
      ...(annotation.id !== undefined ? { id: annotation.id } : {}),
      image_id: annotation.imageId,
      category_id: annotation.categoryId,
      ...(annotation.score !== undefined ? { score: annotation.score } : {}),
      ...(annotation.attributes ? { attributes: annotation.attributes } : {}),
      ...(annotation.flags?.iscrowd ? { iscrowd: 1 } : {}),
    }

    if (annotation.type === 'bbox') {
      annotations.push({
        ...common,
        bbox: bboxArray(annotation.bbox),
        ...(annotation.area !== undefined ? { area: annotation.area } : {}),
      })
      continue
    }

    if (annotation.type === 'polygon') {
      annotations.push({
        ...common,
        segmentation: annotation.polygons.map((polygon) =>
          polygon.flatMap((point) => [point.x, point.y]),
        ),
        ...(annotation.bbox ? { bbox: bboxArray(annotation.bbox) } : {}),
        ...(annotation.area !== undefined ? { area: annotation.area } : {}),
      })
      continue
    }

    if (annotation.type === 'mask') {
      const segmentation =
        annotation.mask.encoding === 'rle'
          ? { size: annotation.mask.size, counts: annotation.mask.counts }
          : undefined
      annotations.push({
        ...common,
        ...(segmentation ? { segmentation } : {}),
        ...(annotation.bbox ? { bbox: bboxArray(annotation.bbox) } : {}),
        ...(annotation.area !== undefined ? { area: annotation.area } : {}),
      })
      continue
    }

    annotations.push({
      ...common,
      bbox: bboxArray(annotation.bbox),
      keypoints: annotation.keypoints.flatMap((keypoint) => [keypoint.x, keypoint.y, keypoint.v]),
      num_keypoints: annotation.numKeypoints,
      ...(annotation.area !== undefined ? { area: annotation.area } : {}),
    })
  }

  const payload = {
    info: dataset.info ?? { description: 'Exported by LabelAll' },
    ...(dataset.licenses ? { licenses: dataset.licenses } : {}),
    images,
    annotations,
    categories,
  }

  const files: OutputFile[] = [{ path, contents: `${JSON.stringify(payload, null, 2)}\n` }]
  return { files, warnings }
}
