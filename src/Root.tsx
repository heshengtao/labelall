import { useMemo } from 'react'

import { ThemeProvider } from '@mui/material/styles'

import App from './App'
import { useSettingsStore } from './store/settingsStore'
import { createAppTheme } from './theme/createAppTheme'

/** Rebuilds the theme whenever the MD3 seed colour changes in settings. */
export default function Root() {
  const seed = useSettingsStore((state) => state.seed)
  const theme = useMemo(() => createAppTheme({ seed }), [seed])

  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <App />
    </ThemeProvider>
  )
}
