import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { useLegalStore } from '@/store/legalStore'
import { createAppTheme } from '@/theme/createAppTheme'

import { LegalPage } from './LegalPage'

const theme = createAppTheme()

function renderPage() {
  return render(
    <ThemeProvider theme={theme} defaultMode="light">
      <LegalPage />
    </ThemeProvider>,
  )
}

describe('LegalPage', () => {
  beforeAll(async () => {
    const { default: i18n } = await import('@/i18n')
    await i18n.changeLanguage('en-US')
  })

  beforeEach(() => {
    useLegalStore.setState({ route: 'privacy' })
  })

  it('renders the privacy policy', async () => {
    renderPage()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Privacy Policy' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: '1. Overview and scope' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/We cannot see them\./)).toBeInTheDocument()
  })

  it('renders the terms of service when routed there', async () => {
    useLegalStore.setState({ route: 'terms' })
    renderPage()

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Terms of Service' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: '1. Acceptance of these terms' }),
    ).toBeInTheDocument()
  })

  it('renders nothing without a route', () => {
    useLegalStore.setState({ route: null })
    const { container } = renderPage()

    expect(container).toBeEmptyDOMElement()
  })
})
