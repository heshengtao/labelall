import { describe, expect, it } from 'vitest'

import { fixtureReader } from '../../test/fixtures'
import { readCoco, writeCoco } from './coco'

async function readFixture() {
  return readCoco({
    root: 'coco',
    readText: fixtureReader('coco'),
    annotationPath: 'annotations/instances_train.json',
  })
}

describe('writeCoco', () => {
  it('round-trips the fixture back through the reader', async () => {
    const first = await readFixture()
    const written = writeCoco(first.dataset)
    const text = written.files[0].contents

    const second = await readCoco({
      root: 'coco',
      readText: async () => text,
      annotationPath: 'annotations/instances.json',
    })

    expect(second.dataset.images).toHaveLength(2)
    expect(second.dataset.categories).toHaveLength(3)
    expect(second.dataset.annotations.map((annotation) => annotation.type).sort()).toEqual([
      'bbox',
      'keypoints',
      'mask',
      'polygon',
      'polygon',
    ])
  })

  it('preserves keypoint visibility, names and RLE size', async () => {
    const first = await readFixture()
    const text = writeCoco(first.dataset).files[0].contents
    const second = await readCoco({
      root: 'coco',
      readText: async () => text,
      annotationPath: 'annotations/instances.json',
    })

    const keypoints = second.dataset.annotations.find((item) => item.type === 'keypoints')
    if (keypoints?.type === 'keypoints') {
      expect(keypoints.keypoints.map((keypoint) => keypoint.v)).toEqual([2, 0, 1])
      expect(keypoints.keypoints.map((keypoint) => keypoint.name)).toEqual([
        'nose',
        'left_eye',
        'right_eye',
      ])
    }

    const mask = second.dataset.annotations.find((item) => item.type === 'mask')
    if (mask?.type === 'mask' && mask.mask.encoding === 'rle') {
      expect(mask.mask.size).toEqual([480, 640])
    } else {
      throw new Error('expected an RLE mask')
    }
  })
})
