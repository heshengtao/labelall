import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
  type Scheme,
  type TonalPalette,
} from '@material/material-color-utilities'

/**
 * Material Design 3 baseline seed (the canonical purple). Callers may override
 * it — see `createAppTheme`.
 */
export const DEFAULT_SEED = '#6750A4'

/**
 * The MD3 colour roles we map onto MUI's palette.
 *
 * Note: the `Scheme` class shipped by material-color-utilities predates the
 * newer `surfaceContainer*` / `surfaceDim` / `surfaceBright` roles, so those are
 * derived from the neutral tonal palette using the tone values defined in the
 * MD3 spec (https://m3.material.io/styles/color/roles).
 */
export interface Md3Roles {
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
  secondary: string
  onSecondary: string
  secondaryContainer: string
  onSecondaryContainer: string
  tertiary: string
  onTertiary: string
  tertiaryContainer: string
  onTertiaryContainer: string
  error: string
  onError: string
  errorContainer: string
  onErrorContainer: string
  background: string
  onBackground: string
  surface: string
  onSurface: string
  surfaceVariant: string
  onSurfaceVariant: string
  surfaceDim: string
  surfaceBright: string
  surfaceContainerLowest: string
  surfaceContainerLow: string
  surfaceContainer: string
  surfaceContainerHigh: string
  surfaceContainerHighest: string
  outline: string
  outlineVariant: string
  inverseSurface: string
  inverseOnSurface: string
  inversePrimary: string
  shadow: string
  scrim: string
}

const hex = (argb: number): string => hexFromArgb(argb)

/** Neutral tone values for the surface roles, per the MD3 spec. */
const SURFACE_TONES = {
  light: {
    dim: 87,
    bright: 98,
    lowest: 100,
    low: 96,
    container: 94,
    high: 92,
    highest: 90,
  },
  dark: {
    dim: 6,
    bright: 24,
    lowest: 4,
    low: 6,
    container: 12,
    high: 17,
    highest: 22,
  },
} as const

export function rolesFromScheme(scheme: Scheme, neutral: TonalPalette, isDark: boolean): Md3Roles {
  const tones = isDark ? SURFACE_TONES.dark : SURFACE_TONES.light
  const tone = (t: number): string => hex(neutral.tone(t))

  return {
    primary: hex(scheme.primary),
    onPrimary: hex(scheme.onPrimary),
    primaryContainer: hex(scheme.primaryContainer),
    onPrimaryContainer: hex(scheme.onPrimaryContainer),
    secondary: hex(scheme.secondary),
    onSecondary: hex(scheme.onSecondary),
    secondaryContainer: hex(scheme.secondaryContainer),
    onSecondaryContainer: hex(scheme.onSecondaryContainer),
    tertiary: hex(scheme.tertiary),
    onTertiary: hex(scheme.onTertiary),
    tertiaryContainer: hex(scheme.tertiaryContainer),
    onTertiaryContainer: hex(scheme.onTertiaryContainer),
    error: hex(scheme.error),
    onError: hex(scheme.onError),
    errorContainer: hex(scheme.errorContainer),
    onErrorContainer: hex(scheme.onErrorContainer),
    background: hex(scheme.background),
    onBackground: hex(scheme.onBackground),
    surface: hex(scheme.surface),
    onSurface: hex(scheme.onSurface),
    surfaceVariant: hex(scheme.surfaceVariant),
    onSurfaceVariant: hex(scheme.onSurfaceVariant),
    surfaceDim: tone(tones.dim),
    surfaceBright: tone(tones.bright),
    surfaceContainerLowest: tone(tones.lowest),
    surfaceContainerLow: tone(tones.low),
    surfaceContainer: tone(tones.container),
    surfaceContainerHigh: tone(tones.high),
    surfaceContainerHighest: tone(tones.highest),
    outline: hex(scheme.outline),
    outlineVariant: hex(scheme.outlineVariant),
    inverseSurface: hex(scheme.inverseSurface),
    inverseOnSurface: hex(scheme.inverseOnSurface),
    inversePrimary: hex(scheme.inversePrimary),
    shadow: hex(scheme.shadow),
    scrim: hex(scheme.scrim),
  }
}

export interface Md3Theme {
  seed: string
  light: Md3Roles
  dark: Md3Roles
}

/** Build the full MD3 role set for light and dark from a single seed colour. */
export function buildMd3Theme(seed: string = DEFAULT_SEED): Md3Theme {
  const theme = themeFromSourceColor(argbFromHex(seed))

  return {
    seed,
    light: rolesFromScheme(theme.schemes.light, theme.palettes.neutral, false),
    dark: rolesFromScheme(theme.schemes.dark, theme.palettes.neutral, true),
  }
}
