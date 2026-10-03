import { describe, expect, it } from 'vitest'

import { DEFAULT_SEED, buildMd3Theme } from './md3'

const HEX = /^#[0-9a-f]{6}$/i

/** Relative luminance, used to assert light/dark ordering. */
function luminance(hex: string): number {
  const value = hex.replace('#', '')
  const channels = [0, 2, 4].map((offset) => {
    const c = Number.parseInt(value.slice(offset, offset + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

describe('buildMd3Theme', () => {
  it('produces valid hex colours for every role in both schemes', () => {
    const theme = buildMd3Theme()
    for (const scheme of [theme.light, theme.dark]) {
      for (const [role, value] of Object.entries(scheme)) {
        expect(value, `role ${role}`).toMatch(HEX)
      }
    }
  })

  it('keeps the seed and derives different primaries per scheme', () => {
    const theme = buildMd3Theme()
    expect(theme.seed).toBe(DEFAULT_SEED)
    expect(theme.light.primary).not.toBe(theme.dark.primary)
  })

  it('orders surfaces so light is brighter than dark', () => {
    const theme = buildMd3Theme()
    expect(luminance(theme.light.surface)).toBeGreaterThan(luminance(theme.dark.surface))
    expect(luminance(theme.light.surfaceContainerLowest)).toBeGreaterThan(
      luminance(theme.light.surfaceContainerHighest),
    )
    expect(luminance(theme.dark.surfaceContainerHighest)).toBeGreaterThan(
      luminance(theme.dark.surfaceContainerLowest),
    )
  })

  it('respects a custom seed colour', () => {
    const theme = buildMd3Theme('#00696D')
    expect(theme.seed).toBe('#00696D')
    expect(theme.light.primary).toMatch(HEX)
  })
})
