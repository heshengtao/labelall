/**
 * labelme (JSON) reader — interop only.
 *
 * labelme writes one JSON per image, next to the image itself. Only the shapes
 * the unified model can express are imported: `rectangle` becomes a bounding
 * box, `polygon` becomes a polygon. `circle`, `line`, `point` and `linestrip`
 * have no faithful equivalent here, so they are reported as warnings and
 * skipped rather than silently mangled into something else.
 *
 * There is no class order on disk, so category ids follow first appearance —
 * the order labelme itself lists the shapes in.
 */

import { bboxFromCorners, bboxFromPolygons, polygonsArea } from '../geometry'
import type { Annotation, Category, DatasetModel, ImageRecord, Polygon } from '../model'
import { assignCategoryColors } from '../palette'
import { fileBasename, joinPath } from '../path'
import type { ReadContext, ReadResult } from './types'

interface RawLabelmeShape {
  label?: string
  points?: number[][]
  group_id?: number | null
  shape_type?: string
  flags?: Record<string, unknown>
}

interface RawLabelme {
  version?: string
  flags?: Record<string, unknown>
  shapes?: RawLabelmeShape[]
  imagePath?: string
  imageData?: string | null
  imageHeight?: number
  imageWidth?: number
}

export interface LabelmeReadOptions extends ReadContext {
  /** Path of the labelme JSON, relative to the dataset root. */
  annotationPath: string
  /**
   * Directory holding the image, relative to the root. labelme's `imagePath` is
   * relative to this. Defaults to the root itself.
   */
  imageDir?: string
  /** Split the image belongs to, when known from the directory layout. */
  split?: string
}

function shapeAttributes(shape: RawLabelmeShape): Record<string, unknown> | undefined {
  const flags = shape.flags
  return flags && typeof flags === 'object' && Object.keys(flags).length > 0 ? flags : undefined
}

function toPolygon(points: readonly number[][]): Polygon | null {
  const polygon: Polygon = []
  for (const point of points) {
    if (!Array.isArray(point) || point.length < 2) {
      return null
    }
    const [x, y] = point
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null
    }
    polygon.push({ x, y })
  }
  return polygon.length >= 3 ? polygon : null
}

function shapeToAnnotation(
  shape: RawLabelmeShape,
  imageId: number,
  categoryId: number,
  warn: (message: string) => void,
): Annotation | null {
  const shapeType = shape.shape_type ?? 'polygon'
  const points = shape.points
  const attributes = shapeAttributes(shape)
  const base = {
    imageId,
    categoryId,
    ...(attributes ? { attributes } : {}),
  }

  if (shapeType === 'rectangle') {
    if (!Array.isArray(points) || points.length !== 2) {
      warn(`rectangle shape has ${points?.length ?? 0} points; expected 2 and was skipped`)
      return null
    }
    const [[x1, y1], [x2, y2]] = points
    if (![x1, y1, x2, y2].every((value) => Number.isFinite(value))) {
      warn('rectangle shape has non-numeric corners and was skipped')
      return null
    }
    const bbox = bboxFromCorners(x1, y1, x2, y2)
    return { ...base, type: 'bbox', bbox, area: bbox.width * bbox.height }
  }

  if (shapeType === 'polygon') {
    const polygon = Array.isArray(points) ? toPolygon(points) : null
    if (!polygon) {
      warn('polygon shape has fewer than three valid points and was skipped')
      return null
    }
    return {
      ...base,
      type: 'polygon',
      polygons: [polygon],
      bbox: bboxFromPolygons([polygon]),
      area: polygonsArea([polygon]),
    }
  }

  warn(`shape type "${shapeType}" is not supported by the labelme reader and was skipped`)
  return null
}

export async function readLabelme(options: LabelmeReadOptions): Promise<ReadResult> {
  const { annotationPath, imageDir = '', split } = options
  const warnings: string[] = []
  const warn = (message: string): void => {
    warnings.push(message)
  }

  const raw = JSON.parse(await options.readText(annotationPath)) as RawLabelme

  if (typeof raw.imagePath !== 'string' || raw.imagePath.length === 0) {
    warnings.push(`${annotationPath} has no "imagePath" and was skipped`)
    return {
      dataset: {
        sourceFormat: 'labelme',
        root: options.root,
        images: [],
        categories: [],
        annotations: [],
      },
      warnings,
    }
  }
  if (!Array.isArray(raw.shapes)) {
    warn('labelme file has no "shapes" array; loaded the image only')
  }
  const shapes = Array.isArray(raw.shapes) ? raw.shapes : []

  const categories: Category[] = []
  const categoryIdByName = new Map<string, number>()
  for (const shape of shapes) {
    const name = shape.label
    if (typeof name !== 'string' || name.length === 0 || categoryIdByName.has(name)) {
      continue
    }
    categoryIdByName.set(name, categories.length)
    categories.push({ id: categories.length, name })
  }

  const image: ImageRecord = {
    id: 0,
    filePath: joinPath(imageDir, raw.imagePath),
    fileName: fileBasename(raw.imagePath),
    width: raw.imageWidth ?? 0,
    height: raw.imageHeight ?? 0,
    ...(split ? { split } : {}),
  }

  const annotations: Annotation[] = []
  shapes.forEach((shape, index) => {
    const name = shape.label
    if (typeof name !== 'string' || name.length === 0) {
      warn(`shape ${index} has no label and was skipped`)
      return
    }
    const categoryId = categoryIdByName.get(name)
    if (categoryId === undefined) {
      return
    }
    const annotation = shapeToAnnotation(shape, image.id, categoryId, warn)
    if (annotation) {
      annotations.push(annotation)
    }
  })

  const dataset: DatasetModel = {
    sourceFormat: 'labelme',
    root: options.root,
    images: [image],
    categories: assignCategoryColors(categories),
    annotations,
    classNames: categories.map((category) => category.name),
  }

  return { dataset, warnings }
}

export interface LabelmeDatasetReadOptions extends ReadContext {
  /** labelme JSON files to merge, in the order they should appear. */
  annotationPaths: string[]
  imageDir?: string
}

/**
 * Merge the per-image labelme JSONs into a single dataset.
 *
 * labelme has no dataset-level file, so a "dataset" is just every JSON in the
 * folder. Image and category ids are reassigned as files are appended, and
 * classes are de-duplicated by name. Anything that fails to parse as labelme is
 * reported as a warning rather than failing the whole open.
 */
export async function readLabelmeDataset(options: LabelmeDatasetReadOptions): Promise<ReadResult> {
  const warnings: string[] = []
  const categories: Category[] = []
  const categoryIdByName = new Map<string, number>()
  const images: ImageRecord[] = []
  const annotations: Annotation[] = []

  for (const annotationPath of options.annotationPaths) {
    let result: ReadResult
    try {
      result = await readLabelme({
        root: options.root,
        readText: options.readText,
        annotationPath,
        ...(options.imageDir ? { imageDir: options.imageDir } : {}),
      })
    } catch (error) {
      warnings.push(`${annotationPath} could not be read as labelme: ${(error as Error).message}`)
      continue
    }
    for (const warning of result.warnings) {
      warnings.push(`${annotationPath}: ${warning}`)
    }
    if (result.dataset.images.length === 0) {
      continue
    }

    const localCategoryIds = new Map<number, number>()
    for (const category of result.dataset.categories) {
      let id = categoryIdByName.get(category.name)
      if (id === undefined) {
        id = categories.length
        categoryIdByName.set(category.name, id)
        categories.push({ id, name: category.name })
      }
      localCategoryIds.set(category.id, id)
    }

    const imageId = images.length
    images.push({ ...result.dataset.images[0], id: imageId })

    for (const annotation of result.dataset.annotations) {
      annotations.push({
        ...annotation,
        imageId,
        categoryId: localCategoryIds.get(annotation.categoryId) ?? 0,
      })
    }
  }

  const dataset: DatasetModel = {
    sourceFormat: 'labelme',
    root: options.root,
    images,
    categories: assignCategoryColors(categories),
    annotations,
    classNames: categories.map((category) => category.name),
  }

  return { dataset, warnings }
}
