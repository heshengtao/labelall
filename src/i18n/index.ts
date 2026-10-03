import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import arSA from './locales/ar-SA.json'
import deDE from './locales/de-DE.json'
import enUS from './locales/en-US.json'
import esES from './locales/es-ES.json'
import frFR from './locales/fr-FR.json'
import jaJP from './locales/ja-JP.json'
import koKR from './locales/ko-KR.json'
import ruRU from './locales/ru-RU.json'
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'

export const SUPPORTED_LANGUAGES = [
  'zh-CN',
  'zh-TW',
  'en-US',
  'ja-JP',
  'ko-KR',
  'es-ES',
  'fr-FR',
  'de-DE',
  'ru-RU',
  'ar-SA',
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh-CN'
export const LANGUAGE_STORAGE_KEY = 'labelall.language'

/**
 * Native names, so the picker reads the same in every locale — an English
 * speaker still recognises 日本語, and a Japanese speaker recognises العربية.
 */
export const LANGUAGE_NATIVE_NAMES: Record<SupportedLanguage, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en-US': 'English',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'es-ES': 'Español',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'ru-RU': 'Русский',
  'ar-SA': 'العربية',
}

const RIGHT_TO_LEFT: ReadonlySet<SupportedLanguage> = new Set<SupportedLanguage>(['ar-SA'])

export const resources = {
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  'en-US': { translation: enUS },
  'ja-JP': { translation: jaJP },
  'ko-KR': { translation: koKR },
  'es-ES': { translation: esES },
  'fr-FR': { translation: frFR },
  'de-DE': { translation: deDE },
  'ru-RU': { translation: ruRU },
  'ar-SA': { translation: arSA },
} as const

/** Prefix → supported code; the most specific prefixes must come first. */
const LANGUAGE_PREFIXES: ReadonlyArray<readonly [string, SupportedLanguage]> = [
  ['zh-hant', 'zh-TW'],
  ['zh-tw', 'zh-TW'],
  ['zh-hk', 'zh-TW'],
  ['zh-mo', 'zh-TW'],
  ['zh', 'zh-CN'],
  ['ja', 'ja-JP'],
  ['ko', 'ko-KR'],
  ['es', 'es-ES'],
  ['fr', 'fr-FR'],
  ['de', 'de-DE'],
  ['ru', 'ru-RU'],
  ['ar', 'ar-SA'],
  ['en', 'en-US'],
]

/**
 * Collapse any detected language tag onto one of our exact supported codes.
 *
 * This matters: `supportedLngs` is matched literally, so a browser reporting
 * `ja` or `zh-Hant` must be mapped before i18next resolves the hierarchy —
 * otherwise the resource lookup finds nothing and `t()` echoes keys.
 */
export function normalizeLanguage(language: string | undefined): SupportedLanguage {
  if (!language) {
    return DEFAULT_LANGUAGE
  }
  const lower = language.toLowerCase()
  for (const [prefix, code] of LANGUAGE_PREFIXES) {
    if (lower.startsWith(prefix)) {
      return code
    }
  }
  return DEFAULT_LANGUAGE
}

/** Whether a language lays its interface out right-to-left. */
export function languageDirection(language: string | undefined): 'ltr' | 'rtl' {
  return RIGHT_TO_LEFT.has(normalizeLanguage(language)) ? 'rtl' : 'ltr'
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
