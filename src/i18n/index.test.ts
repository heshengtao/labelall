import { describe, expect, it } from 'vitest'

import i18n, { normalizeLanguage } from './index'

describe('i18n', () => {
  it('resolves translations for both supported languages', async () => {
    await i18n.changeLanguage('en-US')
    expect(i18n.t('app.name')).toBe('LableAll')
    expect(i18n.t('welcome.title')).toBe('Start annotating')

    await i18n.changeLanguage('zh-CN')
    expect(i18n.t('app.name')).toBe('LableAll')
    expect(i18n.t('welcome.title')).toBe('开始标注')
  })

  it('falls back to the default language for unknown tags', async () => {
    await i18n.changeLanguage('fr-FR')
    expect(i18n.resolvedLanguage).toBe('zh-CN')
  })

  it('normalizes detected language tags', () => {
    expect(normalizeLanguage('en')).toBe('en-US')
    expect(normalizeLanguage('en-GB')).toBe('en-US')
    expect(normalizeLanguage('zh')).toBe('zh-CN')
    expect(normalizeLanguage('zh-Hans')).toBe('zh-CN')
    expect(normalizeLanguage(undefined)).toBe('zh-CN')
  })
})
