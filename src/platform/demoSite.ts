import { isTauri } from './detect-env'

/**
 * Hostnames that serve the public demo build.
 *
 * The compliance notice (storage banner + privacy policy / terms pages) is shown
 * only there: the desktop app and anyone self-hosting the static bundle are not
 * our demo, so they stay untouched.
 */
export const DEMO_HOSTNAMES: readonly string[] = ['labelall.superagentparty.com']

/** Whether a hostname is one of the public demo deployments. */
export function isDemoHost(hostname: string | undefined): boolean {
  if (!hostname) {
    return false
  }
  return DEMO_HOSTNAMES.includes(hostname.toLowerCase())
}

/**
 * Whether this build should show the demo compliance notice.
 *
 * `VITE_FORCE_LEGAL=1` forces it on so the flow can be exercised on localhost.
 */
export function isDemoSite(): boolean {
  if (typeof window === 'undefined' || isTauri()) {
    return false
  }
  if (import.meta.env.VITE_FORCE_LEGAL === '1') {
    return true
  }
  return isDemoHost(window.location.hostname)
}
