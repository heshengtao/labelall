import { describe, expect, it } from 'vitest'

import { createExportStamp } from './exportStamp'

describe('createExportStamp', () => {
  it('formats a local timestamp with no characters a file name cannot hold', () => {
    const stamp = createExportStamp(new Date(2026, 9, 5, 16, 30, 45, 7))
    expect(stamp).toBe('20261005-163045007')
    expect(stamp).not.toMatch(/[:\\/*?"<>|]/)
  })

  it('is distinct across milliseconds so back-to-back exports do not collide', () => {
    const first = createExportStamp(new Date(2026, 0, 1, 0, 0, 0, 1))
    const second = createExportStamp(new Date(2026, 0, 1, 0, 0, 0, 2))
    expect(first).not.toBe(second)
  })
})
