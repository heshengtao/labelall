/**
 * Geometry helpers shared by every format reader/writer.
 *
 * All functions work in the model's coordinate convention: absolute pixels,
 * 0-based, top-left origin. Anything that converts from another convention (VOC,
 * YOLO) lives here so the off-by-one rules are defined in exactly one place.
 */

import type { BBox, Point, Polygon } from './model'

/**
 * How Pascal VOC `xmax`/`ymax` are interpreted.
 *
 * The VOC devkit documents 1-based coordinates where the box is inclusive of the
 * boundary pixels ("the top-left pixel in the image has coordinates (1; 1)"), so
 * `width = xmax - xmin + 1`. Plenty of loaders instead treat the box as
 * half-open with `width = xmax - xmin`, which shifts everything by a pixel. We
 * default to the devkit's own definition and expose the alternative.
 */
export type VocBoxPolicy = 'inclusive' | 'exclusive'

export const DEFAULT_VOC_BOX_POLICY: VocBoxPolicy = 'inclusive'

export function bboxFromCorners(x1: number, y1: number, x2: number, y2: number): BBox {
  const x = Math.min(x1, x2)
  const y = Math.min(y1, y2)
  return {
    x,
    y,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  }
}

export function bboxArea(box: BBox): number {
  return box.width * box.height
}

export function bboxCenter(box: BBox): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

export function bboxFromPoints(points: readonly Point[]): BBox {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (const point of points) {
    if (point.x < minX) minX = point.x
    if (point.y < minY) minY = point.y
    if (point.x > maxX) maxX = point.x
    if (point.y > maxY) maxY = point.y
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export function bboxFromPolygons(polygons: readonly Polygon[]): BBox {
  return bboxFromPoints(polygons.flat())
}

/** Signed polygon area (shoelace); returns the absolute area. */
export function polygonArea(polygon: Polygon): number {
  if (polygon.length < 3) {
    return 0
  }
  let sum = 0
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i]
    const next = polygon[(i + 1) % polygon.length]
    sum += current.x * next.y - next.x * current.y
  }
  return Math.abs(sum) / 2
}

export function polygonsArea(polygons: readonly Polygon[]): number {
  return polygons.reduce((total, polygon) => total + polygonArea(polygon), 0)
}

/** Keeps a box inside the image bounds without letting it invert. */
export function clampBBox(box: BBox, imageWidth: number, imageHeight: number): BBox {
  const x = Math.min(Math.max(box.x, 0), imageWidth)
  const y = Math.min(Math.max(box.y, 0), imageHeight)
  return {
    x,
    y,
    width: Math.max(0, Math.min(box.width, imageWidth - x)),
    height: Math.max(0, Math.min(box.height, imageHeight - y)),
  }
}

export function bboxIou(a: BBox, b: BBox): number {
  const left = Math.max(a.x, b.x)
  const top = Math.max(a.y, b.y)
  const right = Math.min(a.x + a.width, b.x + b.width)
  const bottom = Math.min(a.y + a.height, b.y + b.height)
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top)
  if (intersection === 0) {
    return 0
  }
  const union = bboxArea(a) + bboxArea(b) - intersection
  return union === 0 ? 0 : intersection / union
}

export function pointInBBox(point: Point, box: BBox): boolean {
  return (
    point.x >= box.x &&
    point.y >= box.y &&
    point.x <= box.x + box.width &&
    point.y <= box.y + box.height
  )
}

/**
 * Convert a Pascal VOC box (1-based, inclusive by default) to the model's
 * 0-based box.
 */
export function vocBoxToBBox(
  xmin: number,
  ymin: number,
  xmax: number,
  ymax: number,
  policy: VocBoxPolicy = DEFAULT_VOC_BOX_POLICY,
): BBox {
  return {
    x: xmin - 1,
    y: ymin - 1,
    width: policy === 'inclusive' ? xmax - xmin + 1 : xmax - xmin,
    height: policy === 'inclusive' ? ymax - ymin + 1 : ymax - ymin,
  }
}

/** Inverse of {@link vocBoxToBBox}. */
export function bboxToVocBox(
  box: BBox,
  policy: VocBoxPolicy = DEFAULT_VOC_BOX_POLICY,
): { xmin: number; ymin: number; xmax: number; ymax: number } {
  const xmin = Math.round(box.x) + 1
  const ymin = Math.round(box.y) + 1
  const xmax =
    policy === 'inclusive' ? Math.round(box.x + box.width) : Math.round(box.x + box.width) + 1
  const ymax =
    policy === 'inclusive' ? Math.round(box.y + box.height) : Math.round(box.y + box.height) + 1
  return {
    xmin,
    ymin,
    xmax: Math.max(xmax, xmin),
    ymax: Math.max(ymax, ymin),
  }
}

/** De-normalise a YOLO centre-form box (0–1) into an absolute-pixel box. */
export function yoloBoxToBBox(
  xCenter: number,
  yCenter: number,
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number,
): BBox {
  const w = width * imageWidth
  const h = height * imageHeight
  return {
    x: xCenter * imageWidth - w / 2,
    y: yCenter * imageHeight - h / 2,
    width: w,
    height: h,
  }
}

/** Normalise an absolute-pixel box into YOLO's centre form. */
export function bboxToYoloBox(
  box: BBox,
  imageWidth: number,
  imageHeight: number,
): { xCenter: number; yCenter: number; width: number; height: number } {
  return {
    xCenter: (box.x + box.width / 2) / imageWidth,
    yCenter: (box.y + box.height / 2) / imageHeight,
    width: box.width / imageWidth,
    height: box.height / imageHeight,
  }
}

export function denormalizePolygon(
  points: readonly Point[],
  imageWidth: number,
  imageHeight: number,
): Polygon {
  return points.map((point) => ({ x: point.x * imageWidth, y: point.y * imageHeight }))
}

export function normalizePolygon(
  polygon: Polygon,
  imageWidth: number,
  imageHeight: number,
): Point[] {
  return polygon.map((point) => ({ x: point.x / imageWidth, y: point.y / imageHeight }))
}

/** Round to a fixed number of decimals, avoiding `-0` and trailing float noise. */
export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  const rounded = Math.round(value * factor) / factor
  return Object.is(rounded, -0) ? 0 : rounded
}
