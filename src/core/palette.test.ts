import { describe, expect, it } from 'vitest'

import { PALETTE, assignCategoryColors, colorForIndex } from './palette'

const HEX = /^#[0-9a-f]{6}$/i

describe('colorForIndex', () => {
  it('returns a stable colour and wraps around the palette', () => {
    expect(colorForIndex(0)).toMatch(HEX)
    expect(colorForIndex(0)).toBe(colorForIndex(0))
    expect(colorForIndex(0)).not.toBe(colorForIndex(1))
  })

  it('handles negative and out-of-range indices', () => {
    expect(colorForIndex(-1)).toMatch(HEX)
    expect(colorForIndex(PALETTE.length)).toBe(colorForIndex(0))
    expect(colorForIndex(-1)).toBe(colorForIndex(PALETTE.length - 1))
  })
})

describe('assignCategoryColors', () => {
  it('keeps provided colours and fills in the missing ones', () => {
    const result = assignCategoryColors([
      { id: 0, name: 'cat' },
      { id: 1, name: 'dog', color: '#123456' },
    ])
    expect(result[0].color).toMatch(HEX)
    expect(result[1].color).toBe('#123456')
  })
})
