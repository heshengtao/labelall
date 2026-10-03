import { describe, expect, it } from 'vitest'

import {
  bboxFromCorners,
  bboxIou,
  bboxToVocBox,
  bboxToYoloBox,
  clampBBox,
  polygonArea,
  round,
  vocBoxToBBox,
  yoloBoxToBBox,
} from './geometry'

describe('bboxFromCorners', () => {
  it('normalises corners into a top-left box regardless of order', () => {
    expect(bboxFromCorners(40, 60, 10, 20)).toEqual({ x: 10, y: 20, width: 30, height: 40 })
  })
})

describe('VOC box conversion', () => {
  it('uses the inclusive devkit rule by default', () => {
    // (1,1)-(10,10) inclusive covers 10x10 pixels.
    expect(vocBoxToBBox(1, 1, 10, 10)).toEqual({ x: 0, y: 0, width: 10, height: 10 })
  })

  it('honours the exclusive alternative', () => {
    expect(vocBoxToBBox(1, 1, 10, 10, 'exclusive')).toEqual({ x: 0, y: 0, width: 9, height: 9 })
  })

  it('round-trips a model box through the VOC encoding', () => {
    const box = { x: 4, y: 6, width: 10, height: 20 }
    expect(bboxToVocBox(box)).toEqual({ xmin: 5, ymin: 7, xmax: 14, ymax: 26 })
    expect(vocBoxToBBox(5, 7, 14, 26)).toEqual(box)
  })
})

describe('YOLO box conversion', () => {
  it('round-trips a model box through the normalised encoding', () => {
    const box = { x: 4, y: 6, width: 10, height: 20 }
    const yolo = bboxToYoloBox(box, 100, 200)
    expect(yolo).toEqual({ xCenter: 0.09, yCenter: 0.08, width: 0.1, height: 0.1 })
    expect(yoloBoxToBBox(yolo.xCenter, yolo.yCenter, yolo.width, yolo.height, 100, 200)).toEqual(
      box,
    )
  })
})

describe('areas and overlap', () => {
  it('computes polygon area with the shoelace formula', () => {
    expect(
      polygonArea([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ]),
    ).toBe(100)
  })

  it('measures IoU', () => {
    const box = { x: 0, y: 0, width: 10, height: 10 }
    expect(bboxIou(box, box)).toBe(1)
    expect(bboxIou(box, { x: 20, y: 20, width: 10, height: 10 })).toBe(0)
    expect(bboxIou(box, { x: 5, y: 0, width: 10, height: 10 })).toBeCloseTo(1 / 3)
  })

  it('clamps boxes into the image without inverting them', () => {
    expect(clampBBox({ x: -5, y: -5, width: 100, height: 100 }, 20, 20)).toEqual({
      x: 0,
      y: 0,
      width: 20,
      height: 20,
    })
  })
})

describe('round', () => {
  it('rounds to the requested precision without producing negative zero', () => {
    expect(round(1.2345, 2)).toBe(1.23)
    expect(round(-0.0001, 2)).toBe(0)
    expect(Object.is(round(-0.0001, 2), -0)).toBe(false)
  })
})
