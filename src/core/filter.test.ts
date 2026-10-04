import { describe, expect, it } from 'vitest'

import type { DatasetModel } from './model'
import { annotationCountByCategory, subsetByCategories } from './filter'

const dataset: DatasetModel = {
  sourceFormat: 'coco',
  root: 'x',
  images: [
    { id: 0, filePath: 'images/a.jpg', fileName: 'a.jpg', width: 100, height: 50 },
    { id: 1, filePath: 'images/b.jpg', fileName: 'b.jpg', width: 100, height: 50 },
    { id: 2, filePath: 'images/c.jpg', fileName: 'c.jpg', width: 100, height: 50 },
  ],
  categories: [
    { id: 0, name: 'cat', color: '#e5484d' },
    { id: 1, name: 'dog', color: '#0091ff' },
    { id: 2, name: 'bird', color: '#46a758' },
  ],
  annotations: [
    { type: 'bbox', imageId: 0, categoryId: 0, bbox: { x: 1, y: 1, width: 2, height: 2 } },
    { type: 'bbox', imageId: 0, categoryId: 1, bbox: { x: 3, y: 3, width: 2, height: 2 } },
    { type: 'classification', imageId: 1, categoryId: 1 },
  ],
  classNames: ['cat', 'dog', 'bird'],
}

describe('subsetByCategories', () => {
  it('keeps only the selected categories and their annotations', () => {
    const subset = subsetByCategories(dataset, {
      categoryIds: new Set([1]),
      keepUnmatchedImages: false,
    })

    expect(subset.categories.map((category) => category.name)).toEqual(['dog'])
    expect(subset.annotations).toEqual([
      { type: 'bbox', imageId: 0, categoryId: 1, bbox: { x: 3, y: 3, width: 2, height: 2 } },
      { type: 'classification', imageId: 1, categoryId: 1 },
    ])
    expect(subset.images.map((image) => image.id)).toEqual([0, 1])
    expect(subset.classNames).toEqual(['dog'])
  })

  it('drops images with none of the selected classes when negatives are off', () => {
    const subset = subsetByCategories(dataset, {
      categoryIds: new Set([0]),
      keepUnmatchedImages: false,
    })

    // Image 1 only has a "dog" label, image 2 has no annotations at all.
    expect(subset.images.map((image) => image.id)).toEqual([0])
  })

  it('keeps every image when negatives are on', () => {
    const subset = subsetByCategories(dataset, {
      categoryIds: new Set([0]),
      keepUnmatchedImages: true,
    })

    expect(subset.images.map((image) => image.id)).toEqual([0, 1, 2])
    expect(subset.annotations).toHaveLength(1)
  })

  it('rebuilds classNames in the retained category order', () => {
    const subset = subsetByCategories(dataset, {
      categoryIds: new Set([2, 0]),
      keepUnmatchedImages: true,
    })

    expect(subset.classNames).toEqual(['cat', 'bird'])
  })

  it('produces an empty dataset for an empty selection', () => {
    const subset = subsetByCategories(dataset, {
      categoryIds: new Set(),
      keepUnmatchedImages: false,
    })

    expect(subset.categories).toEqual([])
    expect(subset.annotations).toEqual([])
    expect(subset.images).toEqual([])
  })

  it('does not mutate the source dataset', () => {
    subsetByCategories(dataset, { categoryIds: new Set([0]), keepUnmatchedImages: false })

    expect(dataset.categories).toHaveLength(3)
    expect(dataset.annotations).toHaveLength(3)
    expect(dataset.images).toHaveLength(3)
  })
})

describe('annotationCountByCategory', () => {
  it('counts annotations per category id', () => {
    const counts = annotationCountByCategory(dataset)

    expect(counts.get(0)).toBe(1)
    expect(counts.get(1)).toBe(2)
    expect(counts.get(2)).toBeUndefined()
  })
})
