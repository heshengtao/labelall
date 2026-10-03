/**
 * Pascal VOC (XML) reader and writer.
 *
 * The one thing to get right here is the coordinate convention: VOC stores
 * **1-based, inclusive** pixel coordinates, while the model is 0-based. The
 * conversion lives in `geometry.ts` so the off-by-one is defined in exactly one
 * place, and the policy is configurable because plenty of loaders disagree.
 */

import { XMLBuilder, XMLParser } from 'fast-xml-parser'

import {
  bboxArea,
  bboxToVocBox,
  DEFAULT_VOC_BOX_POLICY,
  vocBoxToBBox,
  type VocBoxPolicy,
} from '../geometry'
import type {
  Annotation,
  AnnotationFlags,
  BBox,
  Category,
  DatasetModel,
  ImageRecord,
} from '../model'
import { assignCategoryColors } from '../palette'
import { fileBasename, fileDirname, fileExtension, fileStem, joinPath } from '../path'
import { IMAGE_EXTENSIONS, type DetectedFile } from './detect'
import type { OutputFile, ReadContext, ReadResult, WriteResult } from './types'

const parser = new XMLParser({ ignoreAttributes: false, trimValues: true })
const builder = new XMLBuilder({ ignoreAttributes: false, format: true, indentBy: '  ' })

export interface VocReadOptions extends ReadContext {
  files: DetectedFile[]
  boxPolicy?: VocBoxPolicy
}

interface VocObject {
  name?: unknown
  truncated?: unknown
  difficult?: unknown
  bndbox?: { xmin?: unknown; ymin?: unknown; xmax?: unknown; ymax?: unknown }
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export async function readVoc(options: VocReadOptions): Promise<ReadResult> {
  const warnings: string[] = []
  const policy = options.boxPolicy ?? DEFAULT_VOC_BOX_POLICY

  const inAnnotations = options.files.filter(
    (entry) =>
      !entry.isDir &&
      fileExtension(entry.path) === '.xml' &&
      /(^|\/)Annotations\//.test(entry.path),
  )
  const targets =
    inAnnotations.length > 0
      ? inAnnotations
      : options.files.filter((entry) => !entry.isDir && fileExtension(entry.path) === '.xml')

  if (targets.length === 0) {
    throw new Error('No Pascal VOC annotation XML files were found')
  }

  // Index the images so each XML can be matched to the file it actually
  // describes — whether they live in JPEGImages/ or side by side in a class
  // folder, and whether the XML stores a bare name or a full path.
  const imageFiles = options.files.filter(
    (entry) => !entry.isDir && IMAGE_EXTENSIONS.has(fileExtension(entry.path)),
  )
  const imageByBasename = new Map<string, string>()
  const imageByDirStem = new Map<string, string>()
  for (const image of imageFiles) {
    imageByBasename.set(fileBasename(image.path).toLowerCase(), image.path)
    imageByDirStem.set(`${fileDirname(image.path)}\u0000${fileStem(image.path)}`, image.path)
  }

  const categories: Category[] = []
  const categoryIdByName = new Map<string, number>()
  const images: ImageRecord[] = []
  const annotations: Annotation[] = []

  for (const target of targets) {
    let parsed: { annotation?: Record<string, unknown> }
    try {
      parsed = parser.parse(await options.readText(target.path)) as {
        annotation?: Record<string, unknown>
      }
    } catch (error) {
      warnings.push(`${target.path} could not be parsed: ${(error as Error).message}`)
      continue
    }
    const node = parsed.annotation
    if (!node) {
      warnings.push(`${target.path} has no <annotation> root and was skipped`)
      continue
    }

    const declared = [node.filename, node.path]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .map((value) => fileBasename(value.replace(/\\/g, '/')))

    let imagePath: string | undefined
    for (const candidate of declared) {
      const found = imageByBasename.get(candidate.toLowerCase())
      if (found) {
        imagePath = found
        break
      }
    }
    if (!imagePath) {
      imagePath = imageByDirStem.get(`${fileDirname(target.path)}\u0000${fileStem(target.path)}`)
    }

    const fileName =
      imagePath !== undefined
        ? fileBasename(imagePath)
        : (declared[0] ?? fileBasename(target.path).replace(/\.xml$/i, '.jpg'))
    if (imagePath === undefined) {
      warnings.push(`${target.path}: no matching image found; expected ${fileName}`)
    }

    const size = (node.size ?? {}) as { width?: unknown; height?: unknown }
    const imageId = images.length
    images.push({
      id: imageId,
      filePath: imagePath ?? joinPath('JPEGImages', fileName),
      fileName,
      width: Number(size.width ?? 0) || 0,
      height: Number(size.height ?? 0) || 0,
    })

    for (const object of toArray(node.object as VocObject | VocObject[] | undefined)) {
      const name = String(object.name ?? '').trim() || 'object'
      let categoryId = categoryIdByName.get(name)
      if (categoryId === undefined) {
        categoryId = categories.length
        categoryIdByName.set(name, categoryId)
        categories.push({ id: categoryId, name })
      }

      const box = object.bndbox
      if (!box) {
        warnings.push(`${target.path}: object "${name}" has no bndbox and was skipped`)
        continue
      }
      const bbox = vocBoxToBBox(
        Number(box.xmin),
        Number(box.ymin),
        Number(box.xmax),
        Number(box.ymax),
        policy,
      )
      if (!Number.isFinite(bbox.x) || !Number.isFinite(bbox.y)) {
        warnings.push(
          `${target.path}: object "${name}" has non-numeric coordinates and was skipped`,
        )
        continue
      }

      const flags: AnnotationFlags = {}
      if (Number(object.difficult) === 1) flags.difficult = true
      if (Number(object.truncated) === 1) flags.truncated = true

      annotations.push({
        type: 'bbox',
        imageId,
        categoryId,
        bbox,
        area: bboxArea(bbox),
        ...(Object.keys(flags).length > 0 ? { flags } : {}),
      })
    }
  }

  const dataset: DatasetModel = {
    sourceFormat: 'voc',
    root: options.root,
    images,
    categories: assignCategoryColors(categories),
    annotations,
    classNames: categories.map((category) => category.name),
  }

  return { dataset, warnings }
}

export interface VocWriteOptions {
  boxPolicy?: VocBoxPolicy
}

function flagsOf(annotation: Annotation): AnnotationFlags | undefined {
  return annotation.type === 'classification' ? undefined : annotation.flags
}

/** Box used for a VOC object: the bbox itself, or the bbox a shape carries. */
function annotationBox(annotation: Annotation): BBox | undefined {
  if (annotation.type === 'bbox') return annotation.bbox
  if (annotation.type === 'polygon' || annotation.type === 'mask') return annotation.bbox
  return undefined
}

export function writeVoc(dataset: DatasetModel, options: VocWriteOptions = {}): WriteResult {
  const policy = options.boxPolicy ?? DEFAULT_VOC_BOX_POLICY
  const files: OutputFile[] = []
  const warnings: string[] = []
  const categoryById = new Map(dataset.categories.map((category) => [category.id, category]))

  for (const image of dataset.images) {
    const objects = []
    for (const annotation of dataset.annotations) {
      if (annotation.imageId !== image.id) {
        continue
      }
      const box = annotationBox(annotation)
      if (!box) {
        warnings.push(
          `Annotation of type "${annotation.type}" has no box and was skipped in VOC output`,
        )
        continue
      }
      const { xmin, ymin, xmax, ymax } = bboxToVocBox(box, policy)
      objects.push({
        name: categoryById.get(annotation.categoryId)?.name ?? `class-${annotation.categoryId}`,
        pose: 'Unspecified',
        truncated: flagsOf(annotation)?.truncated ? 1 : 0,
        difficult: flagsOf(annotation)?.difficult ? 1 : 0,
        bndbox: { xmin, ymin, xmax, ymax },
      })
    }

    const xml = builder.build({
      annotation: {
        folder: 'JPEGImages',
        filename: image.fileName ?? fileBasename(image.filePath),
        path: image.filePath,
        source: { database: 'LabelAll' },
        size: { width: image.width, height: image.height, depth: 3 },
        segmented: 0,
        object: objects,
      },
    }) as string

    files.push({ path: `Annotations/${fileStem(image.filePath)}.xml`, contents: xml })
  }

  return { files, warnings }
}
