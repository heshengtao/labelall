import { describe, expect, it } from 'vitest'

import {
  clampAnnotation,
  constrainTranslation,
  duplicateAnnotation,
  resizeBBox,
  translateAnnotation,
  translateBBox,
} from './annotationEdits'
import type { Annotation } from './model'

const box = { x: 10, y: 20, width: 30, height: 40 }

describe('translateBBox', () => {
  it('moves the box without resizing it', () => {
    expect(translateBBox(box, 5, -5)).toEqual({ x: 15, y: 15, width: 30, height: 40 })
  })
})

describe('resizeBBox', () => {
  it('moves a corner and keeps the opposite one fixed', () => {
    expect(resizeBBox(box, 'se', { x: 100, y: 100 })).toEqual({
      x: 10,
      y: 20,
      width: 90,
      height: 80,
    })
    expect(resizeBBox(box, 'nw', { x: 0, y: 0 })).toEqual({ x: 0, y: 0, width: 40, height: 60 })
  })

  it('moves a single edge', () => {
    expect(resizeBBox(box, 'e', { x: 60, y: 999 })).toEqual({ x: 10, y: 20, width: 50, height: 40 })
    expect(resizeBBox(box, 'n', { x: 999, y: 0 })).toEqual({ x: 10, y: 0, width: 30, height: 60 })
  })

  it('normalises when an edge crosses the opposite one', () => {
    expect(resizeBBox(box, 'e', { x: 0, y: 0 })).toEqual({ x: 0, y: 20, width: 10, height: 40 })
  })
})

describe('translateAnnotation', () => {
  it('moves a bbox', () => {
    const annotation: Annotation = { type: 'bbox', imageId: 0, categoryId: 0, bbox: box }
    const moved = translateAnnotation(annotation, 1, 2)
    expect(moved.type).toBe('bbox')
    if (moved.type === 'bbox') {
      expect(moved.bbox).toEqual({ x: 11, y: 22, width: 30, height: 40 })
    }
  })

  it('moves every vertex of a polygon', () => {
    const annotation: Annotation = {
      type: 'polygon',
      imageId: 0,
      categoryId: 0,
      polygons: [
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
        ],
      ],
    }
    const moved = translateAnnotation(annotation, 5, 5)
    if (moved.type === 'polygon') {
      expect(moved.polygons[0]).toEqual([
        { x: 5, y: 5 },
        { x: 15, y: 5 },
        { x: 15, y: 15 },
      ])
    }
  })

  it('moves keypoints and their box together', () => {
    const annotation: Annotation = {
      type: 'keypoints',
      imageId: 0,
      categoryId: 0,
      bbox: box,
      numKeypoints: 1,
      keypoints: [{ x: 10, y: 20, v: 2 }],
    }
    const moved = translateAnnotation(annotation, 3, 4)
    if (moved.type === 'keypoints') {
      expect(moved.keypoints[0]).toMatchObject({ x: 13, y: 24 })
      expect(moved.bbox.x).toBe(13)
    }
  })
})

describe('duplicateAnnotation', () => {
  it('offsets the copy and drops the source id', () => {
    const annotation: Annotation = { type: 'bbox', id: 7, imageId: 0, categoryId: 0, bbox: box }
    const copy = duplicateAnnotation(annotation)
    expect('id' in copy && copy.id).toBeFalsy()
    if (copy.type === 'bbox') {
      expect(copy.bbox).toEqual({ x: 18, y: 28, width: 30, height: 40 })
    }
  })
})

describe('constrainTranslation', () => {
  const annotation: Annotation = {
    type: 'bbox',
    imageId: 0,
    categoryId: 0,
    bbox: { x: 90, y: 90, width: 20, height: 20 },
  }

  it('keeps the whole shape inside the image and preserves its size', () => {
    expect(constrainTranslation(annotation, 50, 50, 100, 100)).toEqual({ dx: -10, dy: -10 })
    expect(constrainTranslation(annotation, -500, -500, 100, 100)).toEqual({ dx: -90, dy: -90 })
  })

  it('uses the polygon bounds', () => {
    const polygon: Annotation = {
      type: 'polygon',
      imageId: 0,
      categoryId: 0,
      polygons: [
        [
          { x: 80, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 20 },
        ],
      ],
    }
    expect(constrainTranslation(polygon, 30, 0, 100, 100)).toEqual({ dx: 0, dy: 0 })
  })

  it('does nothing when the image size is unknown', () => {
    expect(constrainTranslation(annotation, 5, 5, 0, 0)).toEqual({ dx: 5, dy: 5 })
  })
})

describe('clampAnnotation', () => {
  it('clamps a box into the image', () => {
    const annotation: Annotation = {
      type: 'bbox',
      imageId: 0,
      categoryId: 0,
      bbox: { x: -5, y: -5, width: 50, height: 50 },
    }
    const clamped = clampAnnotation(annotation, 100, 100)
    expect(clamped.type === 'bbox' && clamped.bbox).toEqual({ x: 0, y: 0, width: 50, height: 50 })
  })

  it('clamps polygon vertices and recomputes the box', () => {
    const annotation: Annotation = {
      type: 'polygon',
      imageId: 0,
      categoryId: 0,
      polygons: [
        [
          { x: -10, y: -10 },
          { x: 50, y: 0 },
          { x: 50, y: 50 },
        ],
      ],
    }
    const clamped = clampAnnotation(annotation, 100, 100)
    if (clamped.type === 'polygon') {
      expect(clamped.polygons[0]).toEqual([
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
      ])
      expect(clamped.bbox).toEqual({ x: 0, y: 0, width: 50, height: 50 })
    }
  })

  it('clamps keypoints and recomputes the box', () => {
    const annotation: Annotation = {
      type: 'keypoints',
      imageId: 0,
      categoryId: 0,
      bbox: { x: 0, y: 0, width: 0, height: 0 },
      numKeypoints: 2,
      keypoints: [
        { x: -5, y: 0, v: 2 },
        { x: 200, y: 50, v: 2 },
      ],
    }
    const clamped = clampAnnotation(annotation, 100, 100)
    if (clamped.type === 'keypoints') {
      expect(clamped.keypoints[0]).toMatchObject({ x: 0, y: 0 })
      expect(clamped.keypoints[1]).toMatchObject({ x: 100, y: 50 })
      expect(clamped.bbox).toEqual({ x: 0, y: 0, width: 100, height: 50 })
    }
  })

  it('does nothing when the image size is unknown', () => {
    const annotation: Annotation = {
      type: 'bbox',
      imageId: 0,
      categoryId: 0,
      bbox: { x: -5, y: -5, width: 50, height: 50 },
    }
    expect(clampAnnotation(annotation, 0, 0)).toEqual(annotation)
  })
})
