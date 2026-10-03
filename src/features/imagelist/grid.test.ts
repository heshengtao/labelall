import { describe, expect, it } from 'vitest'

import type { Annotation, ImageRecord } from '@/core/model'
import { collectSplits, computeColumnCount, computeGridWindow, filterImages } from './grid'

function image(id: number, overrides: Partial<ImageRecord> = {}): ImageRecord {
  return {
    id,
    filePath: `img${id}.jpg`,
    fileName: `img${id}.jpg`,
    width: 10,
    height: 10,
    ...overrides,
  }
}

describe('computeColumnCount', () => {
  it('fits as many columns as possible, at least one', () => {
    expect(computeColumnCount(0, 100, 10)).toBe(1)
    expect(computeColumnCount(360, 100, 10, 12)).toBe(3)
    expect(computeColumnCount(310, 100, 10, 12)).toBe(2)
  })
})

describe('computeGridWindow', () => {
  it('renders the visible rows plus overscan', () => {
    const window = computeGridWindow({
      columns: 2,
      rowHeight: 100,
      scrollTop: 0,
      viewportHeight: 200,
      itemCount: 20,
      overscanRows: 1,
    })
    expect(window.totalRows).toBe(10)
    expect(window.totalHeight).toBe(1000)
    expect(window.firstRow).toBe(0)
    expect(window.lastRow).toBe(3)
    expect(window.offsetY).toBe(0)
  })

  it('shifts the window when scrolled', () => {
    const window = computeGridWindow({
      columns: 2,
      rowHeight: 100,
      scrollTop: 400,
      viewportHeight: 200,
      itemCount: 20,
      overscanRows: 1,
    })
    expect(window.firstRow).toBe(3)
    expect(window.lastRow).toBe(7)
    expect(window.offsetY).toBe(300)
  })

  it('handles an empty list', () => {
    const window = computeGridWindow({
      columns: 2,
      rowHeight: 100,
      scrollTop: 0,
      viewportHeight: 200,
      itemCount: 0,
    })
    expect(window).toMatchObject({ totalRows: 0, lastRow: -1, totalHeight: 0 })
  })
})

describe('filterImages', () => {
  const images = [
    image(0, { split: 'train', fileName: 'cat.jpg' }),
    image(1, { split: 'val', fileName: 'dog.jpg' }),
    image(2, { split: 'val', fileName: 'cat2.jpg' }),
  ]
  const annotations: Annotation[] = [
    { type: 'classification', imageId: 0, categoryId: 7 },
    { type: 'classification', imageId: 2, categoryId: 8 },
  ]

  it('filters by split, category and search text together', () => {
    expect(
      filterImages(images, annotations, { split: 'val', categoryId: 'all', query: '' }).map(
        (item) => item.id,
      ),
    ).toEqual([1, 2])

    expect(
      filterImages(images, annotations, { split: 'all', categoryId: 7, query: '' }).map(
        (item) => item.id,
      ),
    ).toEqual([0])

    expect(
      filterImages(images, annotations, { split: 'all', categoryId: 'all', query: 'CAT' }).map(
        (item) => item.id,
      ),
    ).toEqual([0, 2])
  })

  it('collects the splits in first-seen order', () => {
    expect(collectSplits(images)).toEqual(['train', 'val'])
    expect(collectSplits([image(5)])).toEqual([])
  })
})
