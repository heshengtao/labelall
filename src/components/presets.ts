import { PALETTE } from '@/core/palette'

/** MD3-adjacent seeds, shown first in the accent picker. */
const MD3_SEEDS = ['#6750a4', '#00696d', '#7d5260', '#386a20', '#8b5000'] as const

/** Accent presets: five MD3 seeds followed by the category palette (26 total). */
export const SEED_PRESETS: readonly string[] = [...MD3_SEEDS, ...PALETTE]

/** Two full rows of thirteen. */
export const SEED_COLUMNS = 13

/** Category default colours, laid out seven per row. */
export const CATEGORY_COLUMNS = 7

/** Convert HSL (hue in degrees, saturation/lightness 0–1) to `#rrggbb`. */
export function hslToHex(hue: number, saturation: number, lightness: number): string {
  const h = ((hue % 360) + 360) % 360
  const s = Math.min(1, Math.max(0, saturation))
  const l = Math.min(1, Math.max(0, lightness))

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  const rgb =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]

  const channel = (value: number): string =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, '0')

  return `#${rgb.map(channel).join('')}`
}

const HUE_STEPS = Array.from({ length: 12 }, (_, index) => index * 30)
const TONES = [0.72, 0.58, 0.44, 0.3]

/** A broader generated palette — twelve hues across four tones. */
export const PALETTE_GRID: readonly string[] = HUE_STEPS.flatMap((hue) =>
  TONES.map((lightness) => hslToHex(hue, 0.7, lightness)),
)

export const PALETTE_COLUMNS = HUE_STEPS.length
