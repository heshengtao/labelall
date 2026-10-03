import { createTheme, type PaletteOptions, type Theme } from '@mui/material/styles'

import { DEFAULT_SEED, buildMd3Theme, type Md3Roles } from './md3'

function paletteFromRoles(roles: Md3Roles): PaletteOptions {
  return {
    primary: { main: roles.primary, contrastText: roles.onPrimary },
    secondary: { main: roles.secondary, contrastText: roles.onSecondary },
    // MD3 has no dedicated success/info roles; map them onto existing roles so
    // that MUI components relying on them stay coherent with the scheme.
    info: { main: roles.primary, contrastText: roles.onPrimary },
    success: { main: roles.secondary, contrastText: roles.onSecondary },
    warning: { main: roles.tertiary, contrastText: roles.onTertiary },
    error: { main: roles.error, contrastText: roles.onError },
    background: {
      default: roles.surface,
      paper: roles.surfaceContainer,
    },
    text: {
      primary: roles.onSurface,
      secondary: roles.onSurfaceVariant,
    },
    divider: roles.outlineVariant,
  }
}

export interface CreateAppThemeOptions {
  seed?: string
}

/**
 * Create the MUI theme wired to the MD3 colour roles. CSS variables are enabled
 * so the two colour schemes can be switched at runtime without a re-render of
 * every styled component.
 */
export function createAppTheme(options: CreateAppThemeOptions = {}): Theme {
  const md3 = buildMd3Theme(options.seed ?? DEFAULT_SEED)

  return createTheme({
    cssVariables: { colorSchemeSelector: 'class' },
    colorSchemes: {
      light: { palette: paletteFromRoles(md3.light) },
      dark: { palette: paletteFromRoles(md3.dark) },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: ['Roboto', 'system-ui', 'Helvetica', 'Arial', 'sans-serif'].join(','),
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          'html, body, #root': {
            height: '100%',
          },
          body: {
            margin: 0,
            overflow: 'hidden',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 100 },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 100 },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'default' },
      },
    },
  })
}

export type AppTheme = ReturnType<typeof createAppTheme>
