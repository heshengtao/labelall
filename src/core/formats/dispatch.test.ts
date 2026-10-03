import { describe, expect, it } from 'vitest'

import { fixtureReader, scanFixture } from '../../test/fixtures'
import { READABLE_FORMATS, parseDataset } from './dispatch'

describe('parseDataset', () => {
  it('parses COCO using the detected annotation path', async () => {
    const { dataset } = await parseDataset(
      {
        format: 'coco',
        files: scanFixture('coco'),
        params: { annotationPath: 'annotations/instances_train.json' },
      },
      { root: 'coco', readText: fixtureReader('coco') },
    )
    expect(dataset.sourceFormat).toBe('coco')
    expect(dataset.images).toHaveLength(2)
  })

  it('parses an ImageFolder listing', async () => {
    const { dataset } = await parseDataset(
      { format: 'imagefolder', files: scanFixture('imagefolder') },
      { root: 'imagefolder', readText: fixtureReader('imagefolder') },
    )
    expect(dataset.images).toHaveLength(4)
    expect(dataset.classNames).toEqual(['bird', 'cat', 'dog'])
  })

  it('merges per-image labelme JSONs into one dataset', async () => {
    const { dataset, warnings } = await parseDataset(
      {
        format: 'labelme',
        files: scanFixture('labelme'),
        params: { annotationPaths: ['img1.json', 'img2.json'] },
      },
      { root: 'labelme', readText: fixtureReader('labelme') },
    )
    expect(dataset.images.map((image) => image.filePath)).toEqual(['img1.jpg', 'img2.jpg'])
    expect(dataset.classNames).toEqual(['cat', 'dog', 'bird'])
    expect(dataset.annotations.map((annotation) => annotation.imageId)).toEqual([0, 0, 1])
    expect(warnings.join('\n')).toContain('img1.json')
    expect(warnings.join('\n')).toContain('"line"')
  })

  it('reports formats that have no reader yet instead of pretending', async () => {
    expect(READABLE_FORMATS.has('other')).toBe(false)
    await expect(
      parseDataset({ format: 'other', files: [] }, { root: 'x', readText: async () => '' }),
    ).rejects.toThrow(/not implemented yet/)
  })

  it('parses a VOC listing', async () => {
    const { dataset } = await parseDataset(
      { format: 'voc', files: scanFixture('voc') },
      { root: 'voc', readText: fixtureReader('voc') },
    )
    expect(dataset.sourceFormat).toBe('voc')
    expect(dataset.annotations).toHaveLength(1)
  })

  it('parses a YOLO listing, denormalising with image sizes', async () => {
    const { dataset } = await parseDataset(
      { format: 'yolo', files: scanFixture('yolo') },
      {
        root: 'yolo',
        readText: fixtureReader('yolo'),
        imageSize: async () => ({ width: 640, height: 480 }),
      },
    )
    expect(dataset.classNames).toEqual(['cat', 'dog'])
    expect(dataset.annotations).toHaveLength(1)
  })
})
