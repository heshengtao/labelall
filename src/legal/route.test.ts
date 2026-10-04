import { describe, expect, it } from 'vitest'

import { hashForRoute, legalRouteFromHash } from './route'

describe('legalRouteFromHash', () => {
  it('recognises the hash routes', () => {
    expect(legalRouteFromHash('#/privacy')).toBe('privacy')
    expect(legalRouteFromHash('#/terms')).toBe('terms')
  })

  it('tolerates a missing or trailing slash and casing', () => {
    expect(legalRouteFromHash('#privacy')).toBe('privacy')
    expect(legalRouteFromHash('#/privacy/')).toBe('privacy')
    expect(legalRouteFromHash('#/Privacy')).toBe('privacy')
  })

  it('returns null for anything else', () => {
    expect(legalRouteFromHash('')).toBeNull()
    expect(legalRouteFromHash('#')).toBeNull()
    expect(legalRouteFromHash('#/')).toBeNull()
    expect(legalRouteFromHash('#/unknown')).toBeNull()
  })
})

describe('hashForRoute', () => {
  it('round-trips through the parser', () => {
    expect(hashForRoute('privacy')).toBe('#/privacy')
    expect(legalRouteFromHash(hashForRoute('terms'))).toBe('terms')
  })
})
