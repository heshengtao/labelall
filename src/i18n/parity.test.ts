import { describe, expect, it } from 'vitest'

import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'

/** Every leaf key path, so the two locales can be compared structurally. */
function flatten(value: unknown, prefix = ''): string[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key),
    )
  }
  return [prefix]
}

describe('locale parity', () => {
  it('zh-CN and en-US define exactly the same keys', () => {
    expect(flatten(zhCN).sort()).toEqual(flatten(enUS).sort())
  })

  it('has no empty translations', () => {
    const empty = flatten(enUS).filter((key) => {
      const value = key.split('.').reduce<unknown>((node, part) => {
        if (node && typeof node === 'object') {
          return (node as Record<string, unknown>)[part]
        }
        return undefined
      }, enUS)
      return typeof value !== 'string' || value.trim() === ''
    })
    expect(empty).toEqual([])
  })
})
