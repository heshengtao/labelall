import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material/styles'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import App from './App'
import { createAppTheme } from './theme/createAppTheme'

const theme = createAppTheme()

function renderApp() {
  return render(
    <ThemeProvider theme={theme} defaultMode="light">
      <App />
    </ThemeProvider>,
  )
}

describe('App', () => {
  beforeAll(async () => {
    // Make the assertions deterministic regardless of the host language.
    const { default: i18n } = await import('./i18n')
    await i18n.changeLanguage('en-US')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders the shell without throwing', () => {
    renderApp()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('LabelAll')).toBeInTheDocument()
  })

  it('shows the welcome call to action', () => {
    renderApp()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Start annotating')
    expect(screen.getByRole('button', { name: /open dataset/i })).toBeInTheDocument()
  })

  it('exposes appearance and language controls', () => {
    renderApp()
    expect(screen.getByRole('button', { name: /appearance/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /language/i })).toBeInTheDocument()
  })

  it('shows the storage notice when forced on, and dismisses it', async () => {
    vi.stubEnv('VITE_FORCE_LEGAL', '1')
    renderApp()

    expect(screen.getByText(/never uploaded/)).toBeInTheDocument()
    // The banner and the persistent footer each offer the policy links.
    expect(screen.getAllByRole('button', { name: 'Terms of Service' })).toHaveLength(2)

    await userEvent.click(screen.getByRole('button', { name: 'Got it' }))

    expect(screen.queryByText(/never uploaded/)).not.toBeInTheDocument()
  })
})
