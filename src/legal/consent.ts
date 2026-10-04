import { POLICY_VERSION } from './version'

export const CONSENT_STORAGE_KEY = 'labelall.legal.consent'

export interface ConsentRecord {
  policyVersion: string
  acceptedAt: string
}

/** Read the stored acknowledgement, or null if absent or malformed. */
export function readConsent(): ConsentRecord | null {
  if (typeof localStorage === 'undefined') {
    return null
  }
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>
    if (typeof parsed.policyVersion !== 'string' || typeof parsed.acceptedAt !== 'string') {
      return null
    }
    return { policyVersion: parsed.policyVersion, acceptedAt: parsed.acceptedAt }
  } catch {
    return null
  }
}

/** Remember that the current policy version has been acknowledged. */
export function acceptConsent(now: Date = new Date()): ConsentRecord {
  const record: ConsentRecord = { policyVersion: POLICY_VERSION, acceptedAt: now.toISOString() }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
    } catch {
      // Storage can be full or blocked; showing the notice again is harmless.
    }
  }
  return record
}

/** Whether the notice is due: never acknowledged, or acknowledged an older version. */
export function needsConsentNotice(record: ConsentRecord | null = readConsent()): boolean {
  return record?.policyVersion !== POLICY_VERSION
}
