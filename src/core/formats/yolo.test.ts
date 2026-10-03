import { describe, expect, it } from 'vitest'

import { fixtureReader, scanFixture } from '../../test/fixtures'
import type { OutputFile } from './types'
import { readYolo, writeYolo } from './yolo'

const SIZE = { width: 640, height: 480 }
const imageSize = async () => SIZE

function outputContext(files: OutputFile[]) {
  const all: Array<{ path: string; contents: string; size: number }> = [
    ...files.map((file) => ({
      path: file.path,
      contents: file.contents,
      size: file.contents.length,
    })),
    { path: 'images/train/a.jpg', contents: '', size: 0 },
  ]
  return {
    files: all.map((file) => ({ path: file.path, isDir: false, size: file.size })),
    readText: (path: string) => {
      const found = all.find((file) => file.path === path)
      return found ? Promise.resolve(found.contents) : Promise.reject(new Error(`missing ${path}`))
    },
  }
}

describe('readYolo', () => {
  it('reads class names from data.yaml and denormalises the box', async () => {
    const { dataset } = await readYolo({
      root: 'yolo',
      readText: fixtureReader('yolo'),
      files: scanFixture('yolo'),
      imageSize,
    })
    expect(dataset.classNames).toEqual(['cat', 'dog'])
    expect(dataset.images).toHaveLength(1)

    const annotation = dataset.annotations[0]
    expect(annotation.type).toBe('bbox')
    if (annotation.type === 'bbox') {
      expect(annotation.bbox).toEqual({ x: 256, y: 168, width: 128, height: 144 })
    }
  })

  it('round-trips a detection dataset', async () => {
    const first = await readYolo({
      root: 'yolo',
      readText: fixtureReader('yolo'),
      files: scanFixture('yolo'),
      imageSize,
    })
    const written = writeYolo(first.dataset, 'detect')
    expect(written.files.some((file) => file.path === 'data.yaml')).toBe(true)

    const context = outputContext(written.files)
    const second = await readYolo({
      root: 'x',
      readText: context.readText,
      files: context.files,
      imageSize,
    })
    const annotation = second.dataset.annotations[0]
    if (annotation.type === 'bbox') {
      expect(annotation.bbox).toEqual({ x: 256, y: 168, width: 128, height: 144 })
    }
  })

  it('writes normalised polygon lines for the segment task', () => {
    const dataset = {
      sourceFormat: 'coco' as const,
      root: 'x',
      images: [{ id: 0, filePath: 'images/a.jpg', width: 100, height: 100 }],
      categories: [{ id: 0, name: 'cat' }],
      annotations: [
        {
          type: 'polygon' as const,
          imageId: 0,
          categoryId: 0,
          polygons: [
            [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
              { x: 100, y: 100 },
            ],
          ],
        },
      ],
    }
    const written = writeYolo(dataset, 'seg')
    const label = written.files.find((file) => file.path.startsWith('labels/'))
    expect(label?.contents.trim()).toBe('0 0 0 1 0 1 1')
  })
})
