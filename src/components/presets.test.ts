import { describe, expect, it } from 'vitest'

import { PALETTE } from '@/core/palette'

import { PALETTE_GRID, SEED_COLUMNS, SEED_PRESETS, hslToHex } from './presets'

const HEX = /^#[0-9a-f]{6}$/

describe('palettes', () => {
  it('has 21 category colours', () => {
    expect(PALETTE).toHaveLength(21)
    expect(new Set(PALETTE).size).toBe(21)
  })

  it('has 26 accent presets that fill two rows of thirteen', () => {
    expect(SEED_PRESETS).toHaveLength(26)
    expect(SEED_COLUMNS * 2).toBe(SEED_PRESETS.length)
    expect(new Set(SEED_PRESETS).size).toBe(26)
  })

  it('generates twelve hues across four tones', () => {
    expect(PALETTE_GRID).toHaveLength(48)
    for (const colour of PALETTE_GRID) {
      expect(colour).toMatch(HEX)
    }
  })
})

describe('hslToHex', () => {
  it('converts the primaries', () => {
    expect(hslToHex(0, 1, 0.5)).toBe('#ff0000')
    expect(hslToHex(120, 1, 0.5)).toBe('#00ff00')
    expect(hslToHex(240, 1, 0.5)).toBe('#0000ff')
  })

  it('handles greys and out-of-range hues', () => {
    expect(hslToHex(0, 0, 0)).toBe('#000000')
    expect(hslToHex(0, 0, 1)).toBe('#ffffff')
    expect(hslToHex(360, 1, 0.5)).toBe(hslToHex(0, 1, 0.5))
  })
})
