import { describe, expect, it } from 'vitest'

import type { Annotation } from '@/core/model'
import { annotationsForImage, imageIndexOf } from './annotations'

describe('annotationsForImage', () => {
  const annotations: Annotation[] = [
    { type: 'classification', imageId: 1, categoryId: 0 },
    { type: 'bbox', imageId: 2, categoryId: 0, bbox: { x: 0, y: 0, width: 1, height: 1 } },
    { type: 'bbox', imageId: 1, categoryId: 1, bbox: { x: 1, y: 1, width: 1, height: 1 } },
  ]

  it('keeps only the annotations of the requested image', () => {
    expect(annotationsForImage(annotations, 1)).toHaveLength(2)
    expect(annotationsForImage(annotations, 2)).toHaveLength(1)
    expect(annotationsForImage(annotations, null)).toEqual([])
  })
})

describe('imageIndexOf', () => {
  it('finds the position of an image id', () => {
    expect(imageIndexOf([4, 5, 6], 5)).toBe(1)
    expect(imageIndexOf([4, 5, 6], 9)).toBe(-1)
    expect(imageIndexOf([4, 5, 6], null)).toBe(-1)
  })
})
