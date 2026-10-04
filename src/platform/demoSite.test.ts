import { afterEach, describe, expect, it, vi } from 'vitest'

import { isDemoHost, isDemoSite } from './demoSite'

afterEach(() => {
  vi.unstubAllEnvs()
  // oxlint-disable-next-line no-underscore-dangle -- Tauri injects this exact global.
  delete window.__TAURI_INTERNALS__
})

describe('isDemoHost', () => {
  it('accepts the demo hostname', () => {
    expect(isDemoHost('labelall.superagentparty.com')).toBe(true)
  })

  it('ignores casing', () => {
    expect(isDemoHost('LabelAll.SuperAgentParty.com')).toBe(true)
  })

  it('rejects other hosts, empty values and undefined', () => {
    expect(isDemoHost('localhost')).toBe(false)
    expect(isDemoHost('labelall.example.com')).toBe(false)
    expect(isDemoHost('')).toBe(false)
    expect(isDemoHost(undefined)).toBe(false)
  })
})

describe('isDemoSite', () => {
  it('is false on a non-demo host', () => {
    expect(isDemoSite()).toBe(false)
  })

  it('is false inside the desktop shell even with the env override', () => {
    // oxlint-disable-next-line no-underscore-dangle -- Tauri injects this exact global.
    window.__TAURI_INTERNALS__ = {}
    vi.stubEnv('VITE_FORCE_LEGAL', '1')
    expect(isDemoSite()).toBe(false)
  })

  it('is forced on by VITE_FORCE_LEGAL', () => {
    vi.stubEnv('VITE_FORCE_LEGAL', '1')
    expect(isDemoSite()).toBe(true)
  })
})
