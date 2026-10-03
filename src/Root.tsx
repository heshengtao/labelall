import { useEffect, useMemo } from 'react'

import { ThemeProvider } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'

import App from './App'
import { languageDirection, normalizeLanguage } from './i18n'
import { useSettingsStore } from './store/settingsStore'
import { createAppTheme } from './theme/createAppTheme'

/** Rebuilds the theme from the seed colour, and mirrors it for RTL languages. */
export default function Root() {
  const seed = useSettingsStore((state) => state.seed)
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? i18n.language
  const direction = languageDirection(language)
  const theme = useMemo(() => createAppTheme({ seed, direction }), [seed, direction])

  useEffect(() => {
    document.documentElement.dir = direction
    document.documentElement.lang = normalizeLanguage(language)
  }, [direction, language])

  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <App />
    </ThemeProvider>
  )
}
