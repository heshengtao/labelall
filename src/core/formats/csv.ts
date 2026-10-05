/**
 * CSV reader and writer.
 *
 * The CSV dialect here is deliberately flat and one-row-per-annotation, which
 * is what most spreadsheet-oriented tooling produces and can represent every
 * geometry the unified model holds:
 *
 *   image,width,height,label,type,xmin,ymin,xmax,ymax,polygon,keypoints
 *
 * - `image` and `label` are required for a labelled row.
 * - `type` is `bbox`, `polygon`, `keypoints` or `classification`; when it is
 *   missing it is inferred from which coordinate columns are filled.
 * - `polygon` holds polygons separated by `|`, each a `x;y;x;y;…` list.
 * - `keypoints` holds `x;y;v;x;y;v;…` (COCO visibility 0/1/2).
 * - An image with no annotations still gets a row with an empty `label`, so
 *   opening and exporting round-trips the whole image list.
 *
 * Parsing uses Papa Parse for correct quoting; writing escapes the fields
 * itself. RLE masks have no CSV form and are reported rather than dropped
 * silently.
 */

import Papa from 'papaparse'

import { bboxArea, bboxFromPoints, polygonsArea } from '../geometry'
import type {
  Annotation,
  BBox,
  Category,
  DatasetModel,
  ImageRecord,
  Keypoint,
  KpVisibility,
  Polygon,
} from '../model'
import { assignCategoryColors } from '../palette'
import { inferSplit } from './detect'
import type { OutputFile, ReadContext, ReadResult, WriteResult } from './types'

interface CsvRow {
  image?: string
  width?: string
  height?: string
  label?: string
  type?: string
  xmin?: string
  ymin?: string
  xmax?: string
  ymax?: string
  polygon?: string
  keypoints?: string
}

export interface CsvReadOptions extends ReadContext {
  /** Path of the CSV file, relative to the dataset root. */
  annotationPath: string
  /** Split the rows belong to, when known from the file name. */
  split?: string
}

function toNumber(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') {
    return null
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parsePolygons(value: string | undefined): Polygon[] {
  if (!value || value.trim() === '') {
    return []
  }
  const polygons: Polygon[] = []
  for (const chunk of value.split('|')) {
    const numbers = chunk
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part !== '')
      .map(Number)
    if (numbers.length < 6 || numbers.some((number) => !Number.isFinite(number))) {
      continue
    }
    const polygon: Polygon = []
    for (let i = 0; i + 1 < numbers.length; i += 2) {
      polygon.push({ x: numbers[i], y: numbers[i + 1] })
    }
    polygons.push(polygon)
  }
  return polygons
}

function toVisibility(value: number): KpVisibility {
  return value === 1 || value === 2 ? value : value > 0 ? 2 : 0
}

function parseKeypoints(value: string | undefined): Keypoint[] {
  if (!value || value.trim() === '') {
    return []
  }
  const numbers = value
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .map(Number)
  const keypoints: Keypoint[] = []
  for (let i = 0; i + 2 < numbers.length; i += 3) {
    if (!Number.isFinite(numbers[i]) || !Number.isFinite(numbers[i + 1])) {
      continue
    }
    keypoints.push({ x: numbers[i], y: numbers[i + 1], v: toVisibility(numbers[i + 2]) })
  }
  return keypoints
}

async function parseCsv(text: string): Promise<CsvRow[]> {
  const result = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: 'greedy' })
  return result.data
}

/** Read a whole CSV dataset into the unified model. */
export async function readCsv(options: CsvReadOptions): Promise<ReadResult> {
  const { annotationPath, split } = options
  const warnings: string[] = []
  const rows = await parseCsv(await options.readText(annotationPath))

  if (rows.length > 0 && !('image' in rows[0])) {
    throw new Error(`${annotationPath} has no "image" column`)
  }

  const images: ImageRecord[] = []
  const imageIdByPath = new Map<string, number>()
  const categories: Category[] = []
  const categoryIdByName = new Map<string, number>()
  const annotations: Annotation[] = []

  const imageOrNull = (path: string, width: number, height: number): number => {
    const existing = imageIdByPath.get(path)
    if (existing !== undefined) {
      return existing
    }
    const id = images.length
    const imageSplit = split ?? inferSplit(path)
    imageIdByPath.set(path, id)
    images.push({
      id,
      filePath: path,
      width,
      height,
      ...(imageSplit ? { split: imageSplit } : {}),
    })
    return id
  }

  rows.forEach((row, index) => {
    const path = (row.image ?? '').trim()
    if (path === '') {
      warnings.push(`row ${index + 2} has no image and was skipped`)
      return
    }
    const imageId = imageOrNull(path, toNumber(row.width) ?? 0, toNumber(row.height) ?? 0)

    const label = (row.label ?? '').trim()
    if (label === '') {
      // Image-only row: keeps the image but carries no annotation.
      return
    }
    let categoryId = categoryIdByName.get(label)
    if (categoryId === undefined) {
      categoryId = categories.length
      categoryIdByName.set(label, categoryId)
      categories.push({ id: categoryId, name: label })
    }

    const xmin = toNumber(row.xmin)
    const ymin = toNumber(row.ymin)
    const xmax = toNumber(row.xmax)
    const ymax = toNumber(row.ymax)
    const polygons = parsePolygons(row.polygon)
    const keypoints = parseKeypoints(row.keypoints)

    if (polygons.length > 0) {
      annotations.push({
        type: 'polygon',
        imageId,
        categoryId,
        polygons,
        bbox: bboxFromPoints(polygons[0]),
        area: polygonsArea(polygons),
      })
      return
    }

    if (keypoints.length > 0) {
      const visible = keypoints.filter((keypoint) => keypoint.v > 0)
      annotations.push({
        type: 'keypoints',
        imageId,
        categoryId,
        bbox: bboxFromPoints(visible.length > 0 ? visible : keypoints),
        keypoints,
        numKeypoints: visible.length,
        area: bboxArea(bboxFromPoints(visible.length > 0 ? visible : keypoints)),
      })
      return
    }

    if (xmin !== null && ymin !== null && xmax !== null && ymax !== null) {
      const bbox: BBox = {
        x: Math.min(xmin, xmax),
        y: Math.min(ymin, ymax),
        width: Math.abs(xmax - xmin),
        height: Math.abs(ymax - ymin),
      }
      annotations.push({ type: 'bbox', imageId, categoryId, bbox, area: bboxArea(bbox) })
      return
    }

    annotations.push({ type: 'classification', imageId, categoryId })
  })

  const dataset: DatasetModel = {
    sourceFormat: 'csv',
    root: options.root,
    images,
    categories: assignCategoryColors(categories),
    annotations,
    classNames: categories.map((category) => category.name),
    origin: { annotationPath },
  }

  return { dataset, warnings }
}

function escapeField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function polygonField(polygons: Polygon[]): string {
  return polygons
    .map((polygon) => polygon.flatMap((point) => [point.x, point.y]).join(';'))
    .join('|')
}

function keypointField(keypoints: Keypoint[]): string {
  return keypoints.flatMap((keypoint) => [keypoint.x, keypoint.y, keypoint.v]).join(';')
}

/** Serialise a dataset to a single one-row-per-annotation CSV. */
export function writeCsv(dataset: DatasetModel): WriteResult {
  const warnings: string[] = []
  const categoryById = new Map(dataset.categories.map((category) => [category.id, category]))
  const header = [
    'image',
    'width',
    'height',
    'label',
    'type',
    'xmin',
    'ymin',
    'xmax',
    'ymax',
    'polygon',
    'keypoints',
  ]
  const lines: string[] = [header.join(',')]

  for (const image of dataset.images) {
    const items = dataset.annotations.filter((annotation) => annotation.imageId === image.id)
    if (items.length === 0) {
      lines.push([image.filePath, String(image.width), String(image.height)].join(','))
      continue
    }

    for (const annotation of items) {
      const label =
        categoryById.get(annotation.categoryId)?.name ?? `class-${annotation.categoryId}`
      const base = [image.filePath, String(image.width), String(image.height), label]
      if (annotation.type === 'bbox') {
        lines.push(
          [
            ...base,
            'bbox',
            String(annotation.bbox.x),
            String(annotation.bbox.y),
            String(annotation.bbox.x + annotation.bbox.width),
            String(annotation.bbox.y + annotation.bbox.height),
            '',
            '',
          ]
            .map(escapeField)
            .join(','),
        )
        continue
      }
      if (annotation.type === 'polygon') {
        lines.push(
          [...base, 'polygon', '', '', '', '', polygonField(annotation.polygons), '']
            .map(escapeField)
            .join(','),
        )
        continue
      }
      if (annotation.type === 'keypoints') {
        lines.push(
          [...base, 'keypoints', '', '', '', '', '', keypointField(annotation.keypoints)]
            .map(escapeField)
            .join(','),
        )
        continue
      }
      if (annotation.type === 'classification') {
        lines.push([...base, 'classification', '', '', '', '', '', ''].map(escapeField).join(','))
        continue
      }
      warnings.push(`Annotation of type "${annotation.type}" has no CSV row and was skipped`)
    }
  }

  const files: OutputFile[] = [{ path: 'annotations.csv', contents: `${lines.join('\n')}\n` }]
  return { files, warnings }
}
