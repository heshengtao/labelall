import { StrictMode } from 'react'

import { ThemeProvider } from '@mui/material/styles'
import { createRoot } from 'react-dom/client'

import App from './App'
import { createAppTheme } from './theme/createAppTheme'
import './i18n'
import './index.css'

// Font imports (bundled locally so the desktop app works fully offline).
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@fontsource/roboto-mono/400.css'

const theme = createAppTheme()

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container #root was not found in the document.')
}

createRoot(container).render(
  <StrictMode>
    <ThemeProvider theme={theme} defaultMode="system">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
