import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'

export const SUPPORTED_LANGUAGES = ['zh-CN', 'en-US'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-CN'
export const LANGUAGE_STORAGE_KEY = 'labelall.language'

export const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS },
} as const

/**
 * Collapse any detected language tag onto one of our exact supported codes.
 *
 * This matters: `supportedLngs` is matched literally, so a browser reporting
 * `en` or `en-GB` must be mapped to `en-US` before i18next resolves the
 * hierarchy — otherwise the resource lookup finds nothing and `t()` echoes keys.
 */
export function normalizeLanguage(language: string | undefined): SupportedLanguage {
  if (!language) {
    return DEFAULT_LANGUAGE
  }
  return language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}

/* oxlint-disable import/no-named-as-default-member -- i18next exposes `.use` on its default export */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
      convertDetectedLanguage: normalizeLanguage,
    },
  })
/* oxlint-enable import/no-named-as-default-member */

export default i18n
