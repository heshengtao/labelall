import { describe, expect, it } from 'vitest'

import { fixtureReader, scanFixture } from '../../test/fixtures'
import type { DatasetModel } from '../model'
import { readMindyolo, writeMindyolo } from './mindyolo'

const imageSize = async (): Promise<{ width: number; height: number }> => ({
  width: 640,
  height: 480,
})

function read(readText = fixtureReader('mindyolo')) {
  return readMindyolo({
    root: 'mindyolo',
    readText,
    files: scanFixture('mindyolo'),
    imageSize,
  })
}

describe('readMindyolo', () => {
  it('reads the split list files and tags each image with its split', async () => {
    const { dataset, warnings } = await read()

    expect(dataset.classNames).toEqual(['cat', 'dog'])
    expect(dataset.images.map((image) => [image.filePath, image.split])).toEqual([
      ['images/train/a.jpg', 'train'],
      ['images/train/b.jpg', 'train'],
      ['images/val/c.jpg', 'val'],
    ])
    expect(dataset.annotations).toHaveLength(3)
    expect(warnings).toEqual([])
  })

  it('loads normally when a split list is missing', async () => {
    const base = fixtureReader('mindyolo')
    const withoutVal = (path: string): Promise<string> => {
      if (path === 'val.txt') {
        return Promise.reject(new Error('missing'))
      }
      return base(path)
    }

    const { dataset, warnings } = await read(withoutVal)

    expect(dataset.images.map((image) => image.split)).toEqual(['train', 'train'])
    expect(warnings.join('\n')).toContain('val.txt')
  })
})

describe('writeMindyolo', () => {
  it('renames images and labels to purely numeric names', async () => {
    const { dataset } = await read()
    const written = writeMindyolo(dataset, { splitName: 'train' })
    const paths = written.files.map((file) => file.path)

    expect(paths).toContain('labels/train/00000001.txt')
    expect(paths).toContain('train.txt')
    expect(paths).toContain('annotations/instances_train2017.json')
    expect(paths).toContain('data.yaml')

    const list = written.files.find((file) => file.path === 'train.txt')?.contents
    expect(list).toBe(
      './images/train/00000001.jpg\n./images/train/00000002.jpg\n./images/val/00000003.jpg\n',
    )

    // The copies follow the renamed paths, so the exported images and labels agree.
    expect(written.images).toEqual([
      { from: 'images/train/a.jpg', to: 'images/train/00000001.jpg' },
      { from: 'images/train/b.jpg', to: 'images/train/00000002.jpg' },
      { from: 'images/val/c.jpg', to: 'images/val/00000003.jpg' },
    ])

    const yaml = written.files.find((file) => file.path === 'data.yaml')?.contents ?? ''
    expect(yaml).toContain('train_set: ./train.txt')
    expect(yaml).toContain('names: ["cat", "dog"]')
  })

  it('writes a COCO eval JSON whose image ids are the numeric file stems', async () => {
    const { dataset } = await read()
    const json =
      writeMindyolo(dataset).files.find((file) => file.path.startsWith('annotations/'))?.contents ??
      '{}'
    const payload = JSON.parse(json)

    expect(payload.categories).toEqual([
      { id: 0, name: 'cat' },
      { id: 1, name: 'dog' },
    ])
    // MindYOLO reads the id back as int(stem), so the two must line up.
    expect(payload.images.map((image: { id: number }) => image.id)).toEqual([1, 2, 3])
    expect(payload.images.map((image: { file_name: string }) => image.file_name)).toEqual([
      '00000001.jpg',
      '00000002.jpg',
      '00000003.jpg',
    ])
    expect(payload.annotations).toHaveLength(3)
    expect(payload.annotations[0]).toMatchObject({ image_id: 1, category_id: 0, iscrowd: 0 })
  })

  it('round-trips through the reader', async () => {
    const { dataset } = await read()
    const written = writeMindyolo(dataset)
    const files = new Map(written.files.map((file) => [file.path, file.contents]))

    const second = await readMindyolo({
      root: 'x',
      readText: (path) => {
        const contents = files.get(path)
        return contents !== undefined
          ? Promise.resolve(contents)
          : Promise.reject(new Error(`missing ${path}`))
      },
      files: [
        { path: 'data.yaml', isDir: false, size: 1 },
        { path: 'images', isDir: true, size: 0 },
        { path: 'labels', isDir: true, size: 0 },
      ],
      imageSize,
    })

    const annotationCount = (model: DatasetModel) => model.annotations.length
    expect(annotationCount(second.dataset)).toBe(annotationCount(dataset))
    expect(second.dataset.classNames).toEqual(['cat', 'dog'])
  })
})
