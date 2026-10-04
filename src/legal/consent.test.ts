import { beforeEach, describe, expect, it } from 'vitest'

import { POLICY_VERSION } from './version'
import { CONSENT_STORAGE_KEY, acceptConsent, needsConsentNotice, readConsent } from './consent'

beforeEach(() => {
  localStorage.clear()
})

describe('consent persistence', () => {
  it('reads nothing when nothing was stored', () => {
    expect(readConsent()).toBeNull()
  })

  it('asks for acknowledgement when nothing was stored', () => {
    expect(needsConsentNotice()).toBe(true)
  })

  it('stops asking after acceptance', () => {
    const record = acceptConsent(new Date('2026-10-04T00:00:00Z'))

    expect(record.policyVersion).toBe(POLICY_VERSION)
    expect(readConsent()).toEqual(record)
    expect(needsConsentNotice()).toBe(false)
  })

  it('asks again when the stored version is older', () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ policyVersion: '2000-01-01', acceptedAt: '2000-01-01T00:00:00.000Z' }),
    )

    expect(needsConsentNotice()).toBe(true)
  })

  it('treats malformed storage as nothing stored', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'not json')

    expect(readConsent()).toBeNull()
    expect(needsConsentNotice()).toBe(true)
  })
})
