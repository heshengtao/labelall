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
  const copies: { files: { from: string; to: string }[]; destPrefix: string }[] = []
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
      files: { from: string; to: string }[],
      destPrefix: string,
      onProgress?: (value: number) => void,
    ) => {
      copies.push({ files, destPrefix })
      onProgress?.(1)
    },
  } as unknown as DatasetSource
  return { source, writes, copies }
}

/** A YOLO-ish dataset whose images are not under `images/`. */
const yoloDataset: DatasetModel = {
  sourceFormat: 'voc',
  root: 'set',
  images: [
    { id: 0, filePath: 'JPEGImages/a.jpg', width: 10, height: 10 },
    { id: 1, filePath: 'JPEGImages/b.jpg', width: 10, height: 10 },
  ],
  categories: [{ id: 0, name: 'cat' }],
  annotations: [
    { type: 'bbox', imageId: 0, categoryId: 0, bbox: { x: 1, y: 1, width: 2, height: 2 } },
  ],
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
      {
        files: [
          { from: 'images/a.jpg', to: 'images/a.jpg' },
          { from: 'images/b.jpg', to: 'images/b.jpg' },
        ],
        destPrefix: '../LabelAll_export/coco',
      },
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

  it('writes each split into its own subfolder', async () => {
    const { source, writes, copies } = fakeSource()

    const outcome = await exportDataset(source, handle, dataset, 'coco', {
      copyImages: true,
      split: { train: 1, val: 0, test: 0 },
    })

    expect(writes[0][0].path).toBe('../LabelAll_export/coco/train/annotations/instances.json')
    expect(copies).toEqual([
      {
        files: [
          { from: 'images/a.jpg', to: 'images/a.jpg' },
          { from: 'images/b.jpg', to: 'images/b.jpg' },
        ],
        destPrefix: '../LabelAll_export/coco/train',
      },
    ])
    expect(outcome.splits).toEqual([{ split: 'train', files: 1, images: 2 }])
  })

  it('omits a zero-weight split instead of creating an empty folder', async () => {
    const { source, writes, copies } = fakeSource()

    const outcome = await exportDataset(source, handle, dataset, 'coco', {
      copyImages: true,
      split: { train: 0, val: 1, test: 0 },
    })

    expect(outcome.splits).toEqual([{ split: 'val', files: 1, images: 2 }])
    expect(writes.every((batch) => batch[0].path.startsWith('../LabelAll_export/coco/val/'))).toBe(
      true,
    )
    expect(copies[0].destPrefix).toBe('../LabelAll_export/coco/val')
  })

  it('labels-first puts images/labels under the split and one config at the root', async () => {
    const { source, writes, copies } = fakeSource()

    const outcome = await exportDataset(source, handle, yoloDataset, 'yolo-detect', {
      copyImages: true,
      split: { train: 1, val: 0, test: 0 },
      layout: 'labels-first',
    })

    const written = writes.flat()
    const paths = written.map((file) => file.path)
    // Labels sit inside labels/train, not train/labels.
    expect(paths).toContain('../LabelAll_export/coco/labels/train/a.txt')
    expect(paths).toContain('../LabelAll_export/coco/data.yaml')
    expect(paths).toContain('../LabelAll_export/coco/classes.txt')

    const yaml = written.find((file) => file.path.endsWith('/data.yaml'))?.contents ?? ''
    expect(yaml).toContain('train: images/train')
    expect(yaml).toContain('names:')

    // Images are relocated under images/train.
    expect(copies).toEqual([
      {
        files: [
          { from: 'JPEGImages/a.jpg', to: 'images/train/a.jpg' },
          { from: 'JPEGImages/b.jpg', to: 'images/train/b.jpg' },
        ],
        destPrefix: '../LabelAll_export/coco',
      },
    ])
    expect(outcome.splits).toEqual([{ split: 'train', files: expect.any(Number), images: 2 }])
  })

  it('labels-first writes one COCO JSON per split with images relative to images/', async () => {
    const { source, writes } = fakeSource()

    await exportDataset(source, handle, dataset, 'coco', {
      copyImages: false,
      split: { train: 1, val: 0, test: 0 },
      layout: 'labels-first',
    })

    const json = writes.flat().find((file) => file.path.endsWith('instances_train.json'))
    expect(json?.path).toBe('../LabelAll_export/coco/annotations/instances_train.json')
    const payload = JSON.parse(json?.contents ?? '{}')
    expect(payload.images[0].file_name).toBe('train/a.jpg')
  })

  it('falls back to split-first for formats without a labels-first layout', async () => {
    const { source, writes } = fakeSource()

    await exportDataset(source, handle, dataset, 'imagefolder', {
      copyImages: false,
      split: { train: 1, val: 0, test: 0 },
      layout: 'labels-first',
    })

    expect(writes.flat()[0].path).toBe('../LabelAll_export/coco/train/classes.txt')
  })
})
