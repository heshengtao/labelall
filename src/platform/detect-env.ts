/**
 * Runtime environment detection.
 *
 * Tauri 2 injects `__TAURI_INTERNALS__` into the webview's `window` before the
 * frontend boots, so its presence is a reliable signal that we are running
 * inside the desktop shell rather than a plain browser.
 */
export type RuntimeEnv = 'tauri' | 'web'

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown
  }
}

export function detectRuntimeEnv(): RuntimeEnv {
  if (typeof window === 'undefined') {
    return 'web'
  }
  return '__TAURI_INTERNALS__' in window ? 'tauri' : 'web'
}

export function isTauri(): boolean {
  return detectRuntimeEnv() === 'tauri'
}
