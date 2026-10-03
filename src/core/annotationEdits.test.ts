import { describe, expect, it } from 'vitest'

import {
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
