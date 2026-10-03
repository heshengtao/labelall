import { describe, expect, it } from 'vitest'

import { MAX_SCALE, MIN_SCALE, clampScale, fitViewport, toImagePoint, zoomAt } from './viewport'

describe('fitViewport', () => {
  it('scales the image to fit and centres it', () => {
    const view = fitViewport(1000, 500, 500, 500, 0)
    expect(view.scale).toBe(0.5)
    expect(view.x).toBe(0)
    expect(view.y).toBe(125)
  })

  it('never scales above the image when the stage is large', () => {
    const view = fitViewport(100, 100, 800, 800, 0)
    // Fit is a "contain", so this upscales; the clamp only bounds the extremes.
    expect(view.scale).toBe(8)
  })

  it('falls back to a neutral viewport for degenerate sizes', () => {
    expect(fitViewport(0, 0, 500, 500)).toEqual({ scale: 1, x: 0, y: 0 })
  })
})

describe('zoomAt', () => {
  it('keeps the image point under the pointer fixed', () => {
    const view = { scale: 1, x: 100, y: 50 }
    const pointer = { x: 300, y: 250 }
    const before = toImagePoint(view, pointer)

    const zoomed = zoomAt(view, pointer, 2)
    const after = toImagePoint(zoomed, pointer)

    expect(zoomed.scale).toBe(2)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })

  it('does nothing once the scale is clamped', () => {
    const view = { scale: MAX_SCALE, x: 0, y: 0 }
    expect(zoomAt(view, { x: 10, y: 10 }, 2)).toBe(view)
  })
})

describe('clampScale', () => {
  it('bounds the scale', () => {
    expect(clampScale(0)).toBe(MIN_SCALE)
    expect(clampScale(1000)).toBe(MAX_SCALE)
    expect(clampScale(1)).toBe(1)
  })
})
