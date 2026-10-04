import type { LegalBundle } from './types'

export type { LegalBlock, LegalBundle, LegalDocId, LegalDocument, LegalSection } from './types'
export { POLICY_VERSION } from './version'

/**
 * Locale files are lazy so the long-form legal copy stays out of the main
 * bundle — it is only fetched when someone actually opens a policy page.
 */
const loaders = import.meta.glob<{ default: LegalBundle }>('./locales/*.json')

const FALLBACK_LOCALE = 'en-US'
const cache = new Map<string, LegalBundle>()

/** Load the privacy policy and terms for a locale, falling back to English. */
export async function loadLegal(language: string): Promise<LegalBundle> {
  const cached = cache.get(language)
  if (cached) {
    return cached
  }
  const loader =
    loaders[`./locales/${language}.json`] ?? loaders[`./locales/${FALLBACK_LOCALE}.json`]
  if (!loader) {
    throw new Error(`no legal content is available for "${language}"`)
  }
  const { default: bundle } = await loader()
  cache.set(language, bundle)
  return bundle
}
