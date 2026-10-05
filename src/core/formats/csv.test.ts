import { describe, expect, it } from 'vitest'

import { fixtureReader } from '../../test/fixtures'
import { readCsv, writeCsv } from './csv'

function read() {
  return readCsv({
    root: 'csv',
    readText: fixtureReader('csv'),
    annotationPath: 'annotations.csv',
  })
}

describe('readCsv', () => {
  it('reads boxes, polygons, classifications and keypoints', async () => {
    const { dataset } = await read()

    expect(dataset.sourceFormat).toBe('csv')
    expect(dataset.images.map((image) => image.filePath)).toEqual(['img1.jpg', 'img2.jpg'])
    expect(dataset.classNames).toEqual(['cat', 'dog', 'person'])
    expect(dataset.annotations.map((annotation) => annotation.type)).toEqual([
      'bbox',
      'polygon',
      'classification',
      'keypoints',
    ])

    const box = dataset.annotations[0]
    expect(box.type === 'bbox' ? box.bbox : null).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    })
  })

  it('round-trips through writeCsv', async () => {
    const first = await read()
    const written = writeCsv(first.dataset)
    expect(written.files[0].path).toBe('annotations.csv')

    const text = written.files[0].contents
    const second = await readCsv({
      root: 'csv',
      readText: async () => text,
      annotationPath: 'annotations.csv',
    })

    expect(second.dataset.images.map((image) => image.filePath)).toEqual(['img1.jpg', 'img2.jpg'])
    expect(second.dataset.annotations.map((annotation) => annotation.type)).toEqual([
      'bbox',
      'polygon',
      'classification',
      'keypoints',
    ])
  })

  it('keeps an image that has no annotations', async () => {
    const text = 'image,label\na.jpg,\nb.jpg,cat\n'
    const { dataset } = await readCsv({
      root: 'csv',
      readText: async () => text,
      annotationPath: 'x.csv',
    })
    expect(dataset.images.map((image) => image.filePath)).toEqual(['a.jpg', 'b.jpg'])
    expect(dataset.annotations).toHaveLength(1)
  })
})
