import { describe, expect, it } from 'vitest'

import type { DatasetModel } from '@/core/model'

import { labelsFirstRootFiles, labelsFirstSplit, supportsLabelsFirst } from './labelsFirst'

const dataset: DatasetModel = {
  sourceFormat: 'other',
  root: 'x',
  images: [
    { id: 0, filePath: 'a/x.jpg', width: 10, height: 10 },
    { id: 1, filePath: 'b/x.jpg', width: 10, height: 10 },
  ],
  categories: [
    { id: 0, name: 'cat' },
    { id: 1, name: 'dog' },
  ],
  annotations: [
    { type: 'bbox', imageId: 0, categoryId: 0, bbox: { x: 0, y: 0, width: 1, height: 1 } },
    { type: 'bbox', imageId: 1, categoryId: 1, bbox: { x: 0, y: 0, width: 1, height: 1 } },
  ],
}

describe('supportsLabelsFirst', () => {
  it('covers exactly the container formats', () => {
    expect(supportsLabelsFirst('yolo-detect')).toBe(true)
    expect(supportsLabelsFirst('yolo-seg')).toBe(true)
    expect(supportsLabelsFirst('yolo-pose')).toBe(true)
    expect(supportsLabelsFirst('mindyolo')).toBe(true)
    expect(supportsLabelsFirst('coco')).toBe(true)
    expect(supportsLabelsFirst('voc')).toBe(true)
    expect(supportsLabelsFirst('imagefolder')).toBe(false)
    expect(supportsLabelsFirst('labelme')).toBe(false)
    expect(supportsLabelsFirst('csv')).toBe(false)
  })
})

describe('labelsFirstSplit', () => {
  it('relocates images under images/<split> and de-duplicates basenames', () => {
    const result = labelsFirstSplit(dataset, 'yolo-detect', 'train')

    expect(result.images).toEqual([
      { from: 'a/x.jpg', to: 'images/train/x.jpg' },
      { from: 'b/x.jpg', to: 'images/train/x-2.jpg' },
    ])

    const paths = result.files.map((file) => file.path)
    expect(paths).toContain('labels/train/x.txt')
    expect(paths).toContain('labels/train/x-2.txt')
  })

  it('uses JPEGImages and an Images-relative prefix for VOC', () => {
    const result = labelsFirstSplit(dataset, 'voc', 'val')
    expect(result.images[0].to).toBe('JPEGImages/val/x.jpg')
    expect(result.files.map((file) => file.path)).toContain('Annotations/val/x.xml')
  })

  it('renames MindYOLO images to numeric names and adds the eval JSON and split list', () => {
    const result = labelsFirstSplit(dataset, 'mindyolo', 'train')
    const paths = result.files.map((file) => file.path)
    expect(paths).toContain('annotations/instances_train2017.json')
    expect(paths).toContain('train.txt')
    expect(paths).toContain('labels/train/00000001.txt')
    expect(paths).toContain('labels/train/00000002.txt')

    expect(result.images).toEqual([
      { from: 'a/x.jpg', to: 'images/train/00000001.jpg' },
      { from: 'b/x.jpg', to: 'images/train/00000002.jpg' },
    ])

    const list = result.files.find((file) => file.path === 'train.txt')?.contents
    expect(list).toBe('./images/train/00000001.jpg\n./images/train/00000002.jpg\n')

    const json = JSON.parse(
      result.files.find((file) => file.path.endsWith('.json'))?.contents ?? '{}',
    )
    expect(json.images.map((image: { id: number }) => image.id)).toEqual([1, 2])
    expect(json.images.map((image: { file_name: string }) => image.file_name)).toEqual([
      '00000001.jpg',
      '00000002.jpg',
    ])
  })
})

describe('labelsFirstRootFiles', () => {
  it('writes a data.yaml referencing only the present splits', () => {
    const files = labelsFirstRootFiles(dataset, 'yolo-detect', ['train', 'val'])
    const yaml = files.find((file) => file.path === 'data.yaml')?.contents ?? ''
    expect(yaml).toContain('train: images/train')
    expect(yaml).toContain('val: images/val')
    expect(yaml).not.toContain('test:')
    expect(files.find((file) => file.path === 'classes.txt')?.contents).toBe('cat\ndog\n')
  })

  it('writes a MindYOLO config pointing at the split list files', () => {
    const files = labelsFirstRootFiles(dataset, 'mindyolo', ['train', 'test'])
    const yaml = files.find((file) => file.path === 'data.yaml')?.contents ?? ''
    expect(yaml).toContain('train_set: ./train.txt')
    expect(yaml).toContain('test_set: ./test.txt')
  })

  it('writes no root config for COCO or VOC', () => {
    expect(labelsFirstRootFiles(dataset, 'coco', ['train'])).toEqual([])
    expect(labelsFirstRootFiles(dataset, 'voc', ['train'])).toEqual([])
  })
})
