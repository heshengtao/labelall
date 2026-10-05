import { describe, expect, it } from 'vitest'

import type { DatasetModel } from './model'
import { createEmptyDataset } from './model'
import { createRng, DEFAULT_SPLIT_RATIOS, hasAnyRatio, partitionDataset } from './split'

function datasetWith(images: number): DatasetModel {
  const base = createEmptyDataset('x', 'coco')
  return {
    ...base,
    images: Array.from({ length: images }, (_, id) => ({
      id,
      filePath: `images/${id}.jpg`,
      width: 10,
      height: 10,
    })),
    categories: [{ id: 0, name: 'cat' }],
    annotations: Array.from({ length: images }, (_, id) => ({
      type: 'bbox' as const,
      imageId: id,
      categoryId: 0,
      bbox: { x: 0, y: 0, width: 1, height: 1 },
    })),
  }
}

describe('createRng', () => {
  it('repeats the same sequence for the same seed and differs across seeds', () => {
    const a = createRng(42)
    const b = createRng(42)
    const c = createRng(7)
    const first = [a(), a(), a()]
    expect([b(), b(), b()]).toEqual(first)
    expect([c(), c(), c()]).not.toEqual(first)
  })
})

describe('hasAnyRatio', () => {
  it('is false only when every weight is zero or invalid', () => {
    expect(hasAnyRatio({ train: 0, val: 0, test: 0 })).toBe(false)
    expect(hasAnyRatio({ train: 0, val: 0, test: 1 })).toBe(true)
    expect(hasAnyRatio({ train: -1, val: Number.NaN, test: 0.5 })).toBe(true)
  })
})

describe('partitionDataset', () => {
  it('places every image in exactly one split', () => {
    const partitions = partitionDataset(datasetWith(100), { train: 0.7, val: 0.15, test: 0.15 }, 1)
    const ids = partitions.flatMap((partition) => partition.dataset.images.map((image) => image.id))
    expect(ids).toHaveLength(100)
    expect(new Set(ids).size).toBe(100)
  })

  it('is reproducible for a fixed seed', () => {
    const first = partitionDataset(datasetWith(50), { train: 0.6, val: 0.2, test: 0.2 }, 99).map(
      (partition) => [partition.split, partition.dataset.images.map((image) => image.id)] as const,
    )
    const second = partitionDataset(datasetWith(50), { train: 0.6, val: 0.2, test: 0.2 }, 99).map(
      (partition) => [partition.split, partition.dataset.images.map((image) => image.id)] as const,
    )
    expect(second).toEqual(first)
  })

  it('omits empty splits so val or test can be left out', () => {
    const partitions = partitionDataset(datasetWith(20), { train: 1, val: 0, test: 0 }, 3)
    expect(partitions.map((partition) => partition.split)).toEqual(['train'])
    expect(partitions[0].dataset.images).toHaveLength(20)
  })

  it('gives every positive split at least one image on a tiny dataset', () => {
    const partitions = partitionDataset(datasetWith(3), { train: 0.7, val: 0.15, test: 0.15 }, 0)
    expect(partitions.map((partition) => partition.split)).toEqual(['train', 'val', 'test'])
    expect(partitions.map((partition) => partition.dataset.images.length)).toEqual([1, 1, 1])
  })

  it('deals proportional counts for ten images', () => {
    const partitions = partitionDataset(datasetWith(10), { train: 0.7, val: 0.15, test: 0.15 }, 0)
    expect(
      partitions.map((partition) => [partition.split, partition.dataset.images.length]),
    ).toEqual([
      ['train', 7],
      ['val', 2],
      ['test', 1],
    ])
  })

  it('uses the 70 / 20 / 10 default', () => {
    expect(DEFAULT_SPLIT_RATIOS).toEqual({ train: 0.7, val: 0.2, test: 0.1 })
    const partitions = partitionDataset(datasetWith(10), DEFAULT_SPLIT_RATIOS, 0)
    expect(
      partitions.map((partition) => [partition.split, partition.dataset.images.length]),
    ).toEqual([
      ['train', 7],
      ['val', 2],
      ['test', 1],
    ])
  })

  it('keeps only the annotations belonging to each split', () => {
    const partitions = partitionDataset(datasetWith(10), { train: 0.5, val: 0.5, test: 0 }, 5)
    for (const partition of partitions) {
      const imageIds = new Set(partition.dataset.images.map((image) => image.id))
      expect(partition.dataset.annotations).toHaveLength(imageIds.size)
      expect(
        partition.dataset.annotations.every((annotation) => imageIds.has(annotation.imageId)),
      ).toBe(true)
    }
  })

  it('throws when no split has a positive ratio', () => {
    expect(() => partitionDataset(datasetWith(3), { train: 0, val: 0, test: 0 }, 0)).toThrow(
      /greater than 0/,
    )
  })
})
