/**
 * Pure annotation edits, used by the store and the canvas.
 *
 * Everything here works in the model's coordinate convention (absolute pixels,
 * 0-based) and returns new objects, so the caller can feed the result straight
 * into an immer recipe without worrying about mutation.
 */

import {
  bboxArea,
  bboxFromCorners,
  bboxFromPoints,
  bboxFromPolygons,
  clampBBox,
  clampPoint,
  polygonsArea,
} from './geometry'
import type { Annotation, BBox, Keypoint, Point, Polygon } from './model'

/** A position on a box: corners, then edge midpoints. */
export type BoxEdge = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export const BOX_EDGES: BoxEdge[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export function translateBBox(box: BBox, dx: number, dy: number): BBox {
  return { x: box.x + dx, y: box.y + dy, width: box.width, height: box.height }
}

/** Move one edge (or corner) of a box to `point`, keeping the opposite fixed. */
export function resizeBBox(box: BBox, edge: BoxEdge, point: Point): BBox {
  let left = box.x
  let top = box.y
  let right = box.x + box.width
  let bottom = box.y + box.height
  if (edge.includes('w')) left = point.x
  if (edge.includes('e')) right = point.x
  if (edge.includes('n')) top = point.y
  if (edge.includes('s')) bottom = point.y
  return bboxFromCorners(left, top, right, bottom)
}

export function translatePolygons(polygons: readonly Polygon[], dx: number, dy: number): Polygon[] {
  return polygons.map((polygon) => polygon.map((point) => ({ x: point.x + dx, y: point.y + dy })))
}

export function translateKeypoints(
  keypoints: readonly Keypoint[],
  dx: number,
  dy: number,
): Keypoint[] {
  return keypoints.map((keypoint) => ({ ...keypoint, x: keypoint.x + dx, y: keypoint.y + dy }))
}

export function translateAnnotation(annotation: Annotation, dx: number, dy: number): Annotation {
  switch (annotation.type) {
    case 'bbox':
      return { ...annotation, bbox: translateBBox(annotation.bbox, dx, dy) }
    case 'polygon':
      return {
        ...annotation,
        polygons: translatePolygons(annotation.polygons, dx, dy),
        ...(annotation.bbox ? { bbox: translateBBox(annotation.bbox, dx, dy) } : {}),
      }
    case 'mask':
      return annotation.bbox
        ? { ...annotation, bbox: translateBBox(annotation.bbox, dx, dy) }
        : annotation
    case 'keypoints':
      return {
        ...annotation,
        bbox: translateBBox(annotation.bbox, dx, dy),
        keypoints: translateKeypoints(annotation.keypoints, dx, dy),
      }
    case 'classification':
      return annotation
  }
}

/** The bounding box an annotation occupies, or null when it has no geometry. */
export function annotationBounds(annotation: Annotation): BBox | null {
  switch (annotation.type) {
    case 'bbox':
      return annotation.bbox
    case 'polygon':
      return annotation.bbox ?? bboxFromPolygons(annotation.polygons)
    case 'mask':
      return annotation.bbox ?? null
    case 'keypoints':
      return annotation.bbox
    case 'classification':
      return null
  }
}

/** Whether the image size is known well enough to clamp against. */
function hasBounds(imageWidth: number, imageHeight: number): boolean {
  return imageWidth > 0 && imageHeight > 0
}

/**
 * Clamp a translation so the whole annotation stays inside the image, keeping
 * its shape intact — the "snap to the edge" behaviour while moving or nudging.
 */
export function constrainTranslation(
  annotation: Annotation,
  dx: number,
  dy: number,
  imageWidth: number,
  imageHeight: number,
): { dx: number; dy: number } {
  if (!hasBounds(imageWidth, imageHeight)) {
    return { dx, dy }
  }
  const bounds = annotationBounds(annotation)
  if (!bounds) {
    return { dx, dy }
  }
  const minDx = -bounds.x
  const maxDx = imageWidth - (bounds.x + bounds.width)
  const minDy = -bounds.y
  const maxDy = imageHeight - (bounds.y + bounds.height)
  return {
    dx: Math.min(Math.max(dx, minDx), maxDx),
    dy: Math.min(Math.max(dy, minDy), maxDy),
  }
}

/** Clamp a freshly drawn annotation into the image bounds. */
export function clampAnnotation(
  annotation: Annotation,
  imageWidth: number,
  imageHeight: number,
): Annotation {
  if (!hasBounds(imageWidth, imageHeight)) {
    return annotation
  }
  switch (annotation.type) {
    case 'bbox':
      return { ...annotation, bbox: clampBBox(annotation.bbox, imageWidth, imageHeight) }
    case 'polygon': {
      const polygons = annotation.polygons.map((polygon) =>
        polygon.map((point) => clampPoint(point, imageWidth, imageHeight)),
      )
      return {
        ...annotation,
        polygons,
        bbox: bboxFromPolygons(polygons),
        area: polygonsArea(polygons),
      }
    }
    case 'keypoints': {
      const keypoints = annotation.keypoints.map((keypoint) => ({
        ...keypoint,
        ...clampPoint(keypoint, imageWidth, imageHeight),
      }))
      const bbox = bboxFromPoints(keypoints)
      return { ...annotation, keypoints, bbox, area: bboxArea(bbox) }
    }
    case 'mask':
      return annotation.bbox
        ? { ...annotation, bbox: clampBBox(annotation.bbox, imageWidth, imageHeight) }
        : annotation
    case 'classification':
      return annotation
  }
}

/** A copy offset slightly, so it does not sit exactly on the original. */
export function duplicateAnnotation(annotation: Annotation, offset = 8): Annotation {
  const copy = translateAnnotation(annotation, offset, offset)
  if ('id' in copy) {
    delete copy.id
  }
  return copy
}
