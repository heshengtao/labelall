import { describe, expect, it } from 'vitest'

import type { DatasetModel } from '../model'
import { writeDataset, writeImageFolder } from './write'

const dataset: DatasetModel = {
  sourceFormat: 'coco',
  root: 'x',
  images: [{ id: 0, filePath: 'images/a.jpg', fileName: 'a.jpg', width: 100, height: 50 }],
  categories: [
    { id: 0, name: 'cat', color: '#e5484d' },
    { id: 1, name: 'dog', color: '#0091ff' },
  ],
  annotations: [
    { type: 'bbox', imageId: 0, categoryId: 0, bbox: { x: 10, y: 10, width: 20, height: 20 } },
  ],
}

describe('writeImageFolder', () => {
  it('writes the class order', () => {
    const result = writeImageFolder(dataset)
    expect(result.files).toEqual([{ path: 'classes.txt', contents: 'cat\ndog\n' }])
  })
})

describe('writeDataset', () => {
  it('produces the expected file layout per format', () => {
    expect(writeDataset(dataset, 'coco').files.map((file) => file.path)).toEqual([
      'annotations/instances.json',
    ])
    expect(writeDataset(dataset, 'voc').files.map((file) => file.path)).toEqual([
      'Annotations/a.xml',
    ])
    expect(writeDataset(dataset, 'yolo-detect').files.map((file) => file.path)).toEqual([
      'labels/a.txt',
      'data.yaml',
    ])
    expect(writeDataset(dataset, 'imagefolder').files[0].path).toBe('classes.txt')
  })
})
