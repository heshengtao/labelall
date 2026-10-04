import type { LegalDocId } from './types'

/** Parse `#/privacy` / `#/terms` (tolerating variants) into a document id. */
export function legalRouteFromHash(hash: string): LegalDocId | null {
  const name = hash.replace(/^#\/?/, '').replace(/\/+$/, '').toLowerCase()
  if (name === 'privacy') {
    return 'privacy'
  }
  if (name === 'terms') {
    return 'terms'
  }
  return null
}

export function hashForRoute(route: LegalDocId): string {
  return `#/${route}`
}

/**
 * Navigate to a policy page. The store follows via the `hashchange` listener,
 * so the URL stays the single source of truth and the back button works.
 */
export function navigateToLegal(route: LegalDocId): void {
  if (typeof window === 'undefined') {
    return
  }
  window.location.hash = hashForRoute(route)
}

/** Return to the app from a policy page. */
export function leaveLegal(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.location.hash = ''
}
