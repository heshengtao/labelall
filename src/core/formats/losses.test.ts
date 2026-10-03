import { describe, expect, it } from 'vitest'

import type { Annotation } from '../model'
import { createEmptyDataset } from '../model'
import { collectLosses, resolveExportFormat } from './losses'

const box: Annotation = {
  type: 'bbox',
  imageId: 0,
  categoryId: 0,
  bbox: { x: 0, y: 0, width: 1, height: 1 },
}
const polygon: Annotation = {
  type: 'polygon',
  imageId: 0,
  categoryId: 0,
  polygons: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
  ],
}
const keypoints: Annotation = {
  type: 'keypoints',
  imageId: 0,
  categoryId: 0,
  bbox: { x: 0, y: 0, width: 1, height: 1 },
  keypoints: [{ x: 0, y: 0, v: 2 }],
  numKeypoints: 1,
}

function datasetWith(annotations: Annotation[]) {
  return { ...createEmptyDataset('x', 'coco'), annotations }
}

describe('resolveExportFormat', () => {
  it('picks the YOLO task from the annotation types', () => {
    expect(resolveExportFormat(datasetWith([box]), 'yolo')).toBe('yolo-detect')
    expect(resolveExportFormat(datasetWith([polygon]), 'yolo')).toBe('yolo-seg')
    expect(resolveExportFormat(datasetWith([keypoints]), 'yolo')).toBe('yolo-pose')
  })

  it('passes non-YOLO choices through unchanged', () => {
    expect(resolveExportFormat(datasetWith([keypoints]), 'coco')).toBe('coco')
  })
})

describe('collectLosses', () => {
  it('reports nothing for a plain COCO export', () => {
    expect(collectLosses(datasetWith([box]), 'coco')).toEqual([])
  })

  it('flags geometry that VOC cannot express', () => {
    const losses = collectLosses(datasetWith([polygon, keypoints]), 'voc').join('\n')
    expect(losses).toMatch(/Polygons are reduced/)
    expect(losses).toMatch(/Keypoints are dropped/)
  })

  it('flags losing geometry entirely for ImageFolder', () => {
    expect(collectLosses(datasetWith([box]), 'imagefolder').join('\n')).toMatch(/geometry/i)
  })
})
