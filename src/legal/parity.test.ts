import { describe, expect, it } from 'vitest'

import { SUPPORTED_LANGUAGES } from '@/i18n'

import type { LegalBundle, LegalDocument } from './types'

const modules = import.meta.glob<{ default: LegalBundle }>('./locales/*.json', { eager: true })

const bundles: Record<string, LegalBundle> = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => [
    path.replace('./locales/', '').replace('.json', ''),
    module.default,
  ]),
)

const REFERENCE = 'en-US'
const DOCUMENTS = ['privacy', 'terms'] as const

/**
 * A structural fingerprint: section ids in order, block kinds in order, list
 * sizes, and the exact link targets. Spelling and prose may differ between
 * locales; the shape and the URLs must not.
 */
function signature(document: LegalDocument): string {
  return document.sections
    .map((section) => {
      const blocks = section.blocks
        .map((block) => {
          if (block.kind === 'ul') {
            return `ul(${block.items.length})`
          }
          if (block.kind === 'links') {
            return `links(${block.items.map((item) => item.href).join('|')})`
          }
          return 'p'
        })
        .join(',')
      return `${section.id}[${blocks}]`
    })
    .join(';')
}

/** Every user-visible string in a document, so none can be left blank. */
function strings(document: LegalDocument): string[] {
  const out = [document.title, document.updatedAt]
  for (const section of document.sections) {
    out.push(section.id, section.heading)
    for (const block of section.blocks) {
      if (block.kind === 'p') {
        out.push(block.text)
      } else if (block.kind === 'ul') {
        out.push(...block.items)
      } else {
        for (const item of block.items) {
          out.push(item.label, item.href)
        }
      }
    }
  }
  return out
}

describe('legal content parity', () => {
  it('covers exactly the supported UI languages', () => {
    expect(Object.keys(bundles).sort()).toEqual([...SUPPORTED_LANGUAGES].sort())
  })

  it('has the expected document lengths in the reference locale', () => {
    expect(bundles[REFERENCE].privacy.sections).toHaveLength(10)
    expect(bundles[REFERENCE].terms.sections).toHaveLength(11)
  })

  it.each(Object.keys(bundles))('%s matches the reference structure', (language) => {
    for (const id of DOCUMENTS) {
      expect(signature(bundles[language][id])).toBe(signature(bundles[REFERENCE][id]))
    }
  })

  it.each(Object.keys(bundles))('%s has no empty strings', (language) => {
    for (const id of DOCUMENTS) {
      const empty = strings(bundles[language][id]).filter((value) => value.trim() === '')
      expect(empty).toEqual([])
    }
  })

  it.each(Object.keys(bundles))('%s uses an ISO updatedAt date', (language) => {
    for (const id of DOCUMENTS) {
      expect(bundles[language][id].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
