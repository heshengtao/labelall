import { describe, expect, it } from 'vitest'

import { estimateTextWidth } from './label'

describe('estimateTextWidth', () => {
  it('is zero for an empty string', () => {
    expect(estimateTextWidth('', 12)).toBe(0)
  })

  it('scales with the font size', () => {
    expect(estimateTextWidth('abc', 10)).toBeCloseTo(18)
    expect(estimateTextWidth('abc', 20)).toBeCloseTo(36)
  })

  it('treats CJK characters as full width', () => {
    expect(estimateTextWidth('中文', 10)).toBeCloseTo(20)
    expect(estimateTextWidth('横担', 10)).toBeCloseTo(20)
  })
})
