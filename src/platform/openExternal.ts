import { isTauri } from './detect-env'

export const GITHUB_URL = 'https://github.com/heshengtao/labelall'

/**
 * Open a URL in the user's browser: through the opener plugin on desktop, and a
 * new tab on the web.
 */
export async function openExternal(url: string): Promise<void> {
  if (isTauri()) {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(url)
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
