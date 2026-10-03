import { describe, expect, it } from 'vitest'

import type { Annotation } from '@/core/model'
import { annotationsForImage, imageIndexOf } from './annotations'

describe('annotationsForImage', () => {
  const annotations: Annotation[] = [
    { type: 'classification', imageId: 1, categoryId: 0 },
    { type: 'bbox', imageId: 2, categoryId: 0, bbox: { x: 0, y: 0, width: 1, height: 1 } },
    { type: 'bbox', imageId: 1, categoryId: 1, bbox: { x: 1, y: 1, width: 1, height: 1 } },
  ]

  it('keeps the annotations of one image with their global indices', () => {
    const entries = annotationsForImage(annotations, 1)
    expect(entries.map((entry) => entry.index)).toEqual([0, 2])
    expect(entries.map((entry) => entry.annotation.type)).toEqual(['classification', 'bbox'])
  })

  it('handles a missing image', () => {
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
