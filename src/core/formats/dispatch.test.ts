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
    expect(READABLE_FORMATS.has('voc')).toBe(false)
    await expect(
      parseDataset({ format: 'voc', files: [] }, { root: 'x', readText: async () => '' }),
    ).rejects.toThrow(/not implemented yet/)
  })
})
