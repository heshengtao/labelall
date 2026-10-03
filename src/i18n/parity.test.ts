import { describe, expect, it } from 'vitest'

import { SUPPORTED_LANGUAGES, resources } from './index'

/** Every leaf key path, so locales can be compared structurally. */
function flatten(value: unknown, prefix = ''): string[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key),
    )
  }
  return [prefix]
}

type Catalog = Record<string, unknown>

const enKeys = flatten(resources['en-US'].translation as Catalog).sort()

describe('locale parity', () => {
  it.each(SUPPORTED_LANGUAGES)('%s defines exactly the keys of en-US', (language) => {
    const catalog = resources[language].translation as Catalog
    expect(flatten(catalog).sort()).toEqual(enKeys)
  })

  it.each(SUPPORTED_LANGUAGES)('%s has no empty translations', (language) => {
    const catalog = resources[language].translation as Catalog
    const empty = flatten(catalog).filter((key) => {
      const value = key.split('.').reduce<unknown>((node, part) => {
        if (node && typeof node === 'object') {
          return (node as Record<string, unknown>)[part]
        }
        return undefined
      }, catalog)
      return typeof value !== 'string' || value.trim() === ''
    })
    expect(empty).toEqual([])
  })
})
