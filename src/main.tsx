import { StrictMode } from 'react'

import { createRoot } from 'react-dom/client'

import Root from './Root'
import './i18n'
import './index.css'

// Font imports (bundled locally so the desktop app works fully offline).
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@fontsource/roboto-mono/400.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container #root was not found in the document.')
}

createRoot(container).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
