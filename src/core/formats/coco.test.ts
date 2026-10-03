import { describe, expect, it } from 'vitest'

import { fixtureReader } from '../../test/fixtures'
import { readCoco } from './coco'

function read() {
  return readCoco({
    root: 'coco',
    readText: fixtureReader('coco'),
    annotationPath: 'annotations/instances_train.json',
  })
}

describe('readCoco', () => {
  it('reads images and categories, including the keypoint schema', async () => {
    const { dataset } = await read()
    expect(dataset.sourceFormat).toBe('coco')
    expect(dataset.images).toHaveLength(2)
    expect(dataset.images[0].filePath).toBe('img1.jpg')
    expect(dataset.classNames).toEqual(['cat', 'dog', 'person'])

    const person = dataset.categories.find((category) => category.name === 'person')
    expect(person?.keypointSchema?.names).toEqual(['nose', 'left_eye', 'right_eye'])
    expect(person?.keypointSchema?.dims).toBe(3)
    expect(person?.keypointSchema?.skeleton).toEqual([
      [1, 2],
      [1, 3],
    ])
  })

  it('dispatches segmentation by runtime type: polygons, flat polygons and RLE', async () => {
    const { dataset } = await read()
    const byId = new Map(
      dataset.annotations.map((annotation) => [
        'id' in annotation ? annotation.id : undefined,
        annotation,
      ]),
    )

    const polygon = byId.get(1)
    expect(polygon?.type).toBe('polygon')
    if (polygon?.type === 'polygon') {
      expect(polygon.polygons[0]).toHaveLength(4)
    }

    const flat = byId.get(5)
    expect(flat?.type).toBe('polygon')
    if (flat?.type === 'polygon') {
      expect(flat.polygons[0]).toEqual([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
        { x: 7, y: 8 },
      ])
    }

    const rle = byId.get(2)
    expect(rle?.type).toBe('mask')
    if (rle?.type === 'mask' && rle.mask.encoding === 'rle') {
      // COCO's `size` is [height, width].
      expect(rle.mask.size).toEqual([480, 640])
    } else {
      throw new Error('expected an RLE mask annotation')
    }
    expect(rle?.flags?.iscrowd).toBe(true)

    expect(byId.get(4)?.type).toBe('bbox')
  })

  it('reads keypoints with visibility, names and the visible count', async () => {
    const { dataset } = await read()
    const keypoints = dataset.annotations.find((annotation) => annotation.type === 'keypoints')
    if (keypoints?.type !== 'keypoints') {
      throw new Error('expected a keypoints annotation')
    }
    expect(keypoints.keypoints.map((keypoint) => keypoint.v)).toEqual([2, 0, 1])
    expect(keypoints.keypoints.map((keypoint) => keypoint.name)).toEqual([
      'nose',
      'left_eye',
      'right_eye',
    ])
    expect(keypoints.numKeypoints).toBe(2)
  })

  it('warns about annotations referencing an unknown category', async () => {
    const { dataset, warnings } = await read()
    expect(
      dataset.annotations.some((annotation) => 'id' in annotation && annotation.id === 99),
    ).toBe(false)
    expect(warnings.join('\n')).toContain('unknown category 77')
  })

  it('loads nothing but warns when a JSON file is not COCO', async () => {
    const { dataset, warnings } = await readCoco({
      root: 'x',
      readText: async () => '{"foo":1}',
      annotationPath: 'bad.json',
    })
    expect(dataset.images).toHaveLength(0)
    expect(warnings.join('\n')).toContain('images')
  })
})
