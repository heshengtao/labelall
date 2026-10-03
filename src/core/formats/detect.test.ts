import { describe, expect, it } from 'vitest'

import { fixtureReader, scanFixture } from '../../test/fixtures'
import { detectFormat } from './detect'

function detect(name: string) {
  return detectFormat({ files: scanFixture(name), readText: fixtureReader(name) })
}

describe('detectFormat', () => {
  it('detects COCO with full confidence and carries the annotation path', async () => {
    const candidates = await detect('coco')
    expect(candidates[0]).toMatchObject({ format: 'coco', confidence: 1 })
    expect(candidates[0]?.params?.annotationPath).toBe('annotations/instances_train.json')
    expect(candidates[0]?.params?.split).toBe('train')
  })

  it('detects Pascal VOC from the Annotations/ + JPEGImages/ layout', async () => {
    const candidates = await detect('voc')
    expect(candidates[0]).toMatchObject({ format: 'voc', confidence: 1 })
  })

  it('detects VOC when the XML sits in class folders next to its image', async () => {
    const candidates = await detect('voc-inline')
    expect(candidates[0]).toMatchObject({ format: 'voc' })
    expect(candidates[0]?.confidence).toBeGreaterThanOrEqual(0.9)
    expect(candidates.some((candidate) => candidate.format === 'imagefolder')).toBe(true)
  })

  it('detects YOLO from images/ + labels/ and the class names in data.yaml', async () => {
    const candidates = await detect('yolo')
    expect(candidates[0]).toMatchObject({ format: 'yolo', confidence: 1 })
  })

  it('detects classification folders by their class subdirectories', async () => {
    const candidates = await detect('imagefolder')
    expect(candidates[0]).toMatchObject({ format: 'imagefolder' })
    expect(candidates[0]?.confidence).toBeGreaterThanOrEqual(0.8)
  })

  it('prefers labelme over the unverified single-JSON COCO guess', async () => {
    const candidates = await detect('labelme')
    expect(candidates[0]).toMatchObject({ format: 'labelme', confidence: 0.9 })
    expect(candidates[0]?.params?.annotationPaths).toEqual(['img1.json', 'img2.json'])
  })

  it('ranks a YOLO pose dataset as yolo-pose when kpt_shape is present', async () => {
    const files = [
      { path: 'images', isDir: true, size: 0 },
      { path: 'labels', isDir: true, size: 0 },
      { path: 'data.yaml', isDir: false, size: 10 },
    ]
    const candidates = await detectFormat({
      files,
      readText: async () => 'names: [person]\nkpt_shape: [17, 3]\n',
    })
    expect(candidates[0]).toMatchObject({ format: 'yolo-pose', confidence: 1 })
  })
})
