import { beforeEach, describe, expect, it } from 'vitest'

import type { DatasetModel } from '@/core/model'
import { useDatasetStore } from './datasetStore'

function dataset(): DatasetModel {
  return {
    sourceFormat: 'imagefolder',
    root: 'x',
    images: [
      { id: 4, filePath: 'a.jpg', width: 0, height: 0 },
      { id: 5, filePath: 'b.jpg', width: 0, height: 0 },
    ],
    categories: [],
    annotations: [],
  }
}

beforeEach(() => {
  useDatasetStore.getState().close()
})

describe('datasetStore', () => {
  it('selects the first image when a dataset is set', () => {
    useDatasetStore.getState().setDataset({ id: 'h', root: 'x', displayName: 'x' }, dataset(), [])
    expect(useDatasetStore.getState().currentImageId).toBe(4)
  })

  it('handles an empty dataset', () => {
    const empty: DatasetModel = { ...dataset(), images: [] }
    useDatasetStore.getState().setDataset({ id: 'h', root: 'x', displayName: 'x' }, empty, [])
    expect(useDatasetStore.getState().currentImageId).toBeNull()
  })

  it('close() resets everything', () => {
    useDatasetStore
      .getState()
      .setDataset({ id: 'h', root: 'x', displayName: 'x' }, dataset(), ['w'])
    useDatasetStore.getState().close()
    expect(useDatasetStore.getState().dataset).toBeNull()
    expect(useDatasetStore.getState().warnings).toEqual([])
    expect(useDatasetStore.getState().currentImageId).toBeNull()
  })
})
