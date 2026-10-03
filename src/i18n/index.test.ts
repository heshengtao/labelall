import { describe, expect, it } from 'vitest'

import i18n, { languageDirection, normalizeLanguage } from './index'

describe('i18n', () => {
  it('resolves translations for the supported languages', async () => {
    await i18n.changeLanguage('en-US')
    expect(i18n.t('app.name')).toBe('LabelAll')
    expect(i18n.t('welcome.title')).toBe('Start annotating')

    await i18n.changeLanguage('zh-CN')
    expect(i18n.t('welcome.title')).toBe('开始标注')

    await i18n.changeLanguage('zh-TW')
    expect(i18n.t('welcome.title')).toBe('開始標註')

    await i18n.changeLanguage('ja-JP')
    expect(i18n.t('welcome.title')).toBe('アノテーションを始める')

    await i18n.changeLanguage('ar-SA')
    expect(i18n.t('common.cancel')).toBe('إلغاء')
  })

  it('falls back to the default language for unknown tags', async () => {
    await i18n.changeLanguage('xx-YY')
    expect(i18n.resolvedLanguage).toBe('zh-CN')
  })

  it('normalizes detected language tags', () => {
    expect(normalizeLanguage('en')).toBe('en-US')
    expect(normalizeLanguage('en-GB')).toBe('en-US')
    expect(normalizeLanguage('zh')).toBe('zh-CN')
    expect(normalizeLanguage('zh-Hans')).toBe('zh-CN')
    expect(normalizeLanguage('zh-Hant')).toBe('zh-TW')
    expect(normalizeLanguage('zh-TW')).toBe('zh-TW')
    expect(normalizeLanguage('ja')).toBe('ja-JP')
    expect(normalizeLanguage('ko-KR')).toBe('ko-KR')
    expect(normalizeLanguage('es-419')).toBe('es-ES')
    expect(normalizeLanguage('fr')).toBe('fr-FR')
    expect(normalizeLanguage('de-CH')).toBe('de-DE')
    expect(normalizeLanguage('ru')).toBe('ru-RU')
    expect(normalizeLanguage('ar')).toBe('ar-SA')
    expect(normalizeLanguage(undefined)).toBe('zh-CN')
  })

  it('knows which languages are right-to-left', () => {
    expect(languageDirection('ar-SA')).toBe('rtl')
    expect(languageDirection('ar')).toBe('rtl')
    expect(languageDirection('en-US')).toBe('ltr')
    expect(languageDirection('zh-CN')).toBe('ltr')
  })
})
