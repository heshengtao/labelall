import { describe, expect, it } from 'vitest'

import type { DatasetModel } from '@/core/model'
import type { DatasetHandle, DatasetSource } from '@/platform/types'

import { exportDataset } from './exportDataset'

const handle: DatasetHandle = { id: 'h', root: '/data/set', displayName: 'set' }

const dataset: DatasetModel = {
  sourceFormat: 'coco',
  root: 'set',
  images: [
    { id: 0, filePath: 'images/a.jpg', width: 10, height: 10 },
    { id: 1, filePath: 'images/b.jpg', width: 10, height: 10 },
  ],
  categories: [{ id: 0, name: 'cat' }],
  annotations: [
    { type: 'bbox', imageId: 0, categoryId: 0, bbox: { x: 1, y: 1, width: 2, height: 2 } },
  ],
}

function fakeSource() {
  const writes: { path: string; contents: string }[][] = []
  const copies: { relPaths: string[]; destPrefix: string }[] = []
  const source = {
    exportTarget: () => ({
      prefix: '../LabelAll_export/coco',
      displayPath: '/data/LabelAll_export/coco',
    }),
    writeTexts: async (_handle: DatasetHandle, files: { path: string; contents: string }[]) => {
      writes.push(files)
    },
    copyImages: async (
      _handle: DatasetHandle,
      relPaths: string[],
      destPrefix: string,
      onProgress?: (value: number) => void,
    ) => {
      copies.push({ relPaths, destPrefix })
      onProgress?.(1)
    },
  } as unknown as DatasetSource
  return { source, writes, copies }
}

describe('exportDataset', () => {
  it('writes the annotation files under the export prefix', async () => {
    const { source, writes, copies } = fakeSource()

    const outcome = await exportDataset(source, handle, dataset, 'coco', { copyImages: false })

    expect(writes[0][0].path).toBe('../LabelAll_export/coco/annotations/instances.json')
    expect(copies).toHaveLength(0)
    expect(outcome).toEqual({ files: 1, images: 0, warnings: expect.any(Array) })
  })

  it('copies the images into the export folder, preserving their paths', async () => {
    const { source, copies, writes } = fakeSource()
    const progress: number[] = []

    const outcome = await exportDataset(source, handle, dataset, 'coco', {
      copyImages: true,
      onProgress: (value) => progress.push(value),
    })

    expect(writes).toHaveLength(1)
    expect(copies).toEqual([
      { relPaths: ['images/a.jpg', 'images/b.jpg'], destPrefix: '../LabelAll_export/coco' },
    ])
    expect(outcome.images).toBe(2)
    expect(progress.at(-1)).toBe(1)
    for (let i = 1; i < progress.length; i += 1) {
      expect(progress[i]).toBeGreaterThanOrEqual(progress[i - 1])
    }
  })

  it('skips copying when the dataset has no images', async () => {
    const { source, copies } = fakeSource()
    const progress: number[] = []

    const outcome = await exportDataset(source, handle, { ...dataset, images: [] }, 'coco', {
      copyImages: true,
      onProgress: (value) => progress.push(value),
    })

    expect(copies).toHaveLength(0)
    expect(outcome.images).toBe(0)
    expect(progress.at(-1)).toBe(1)
  })
})
