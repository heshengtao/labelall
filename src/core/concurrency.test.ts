import { describe, expect, it } from 'vitest'

import { FILE_READ_CONCURRENCY, mapLimit } from './concurrency'

describe('mapLimit', () => {
  it('preserves input order and passes the index', async () => {
    const result = await mapLimit([10, 20, 30], 2, async (value, index) => {
      await Promise.resolve()
      return `${index}:${value}`
    })

    expect(result).toEqual(['0:10', '1:20', '2:30'])
  })

  it('never exceeds the concurrency limit', async () => {
    let inFlight = 0
    let peak = 0
    await mapLimit(
      Array.from({ length: 20 }, (_, index) => index),
      4,
      async () => {
        inFlight += 1
        peak = Math.max(peak, inFlight)
        await new Promise((resolve) => setTimeout(resolve, 1))
        inFlight -= 1
      },
    )

    expect(peak).toBeLessThanOrEqual(4)
    expect(peak).toBeGreaterThan(1)
  })

  it('caps the worker count at the item count', async () => {
    let inFlight = 0
    let peak = 0
    await mapLimit([1, 2], FILE_READ_CONCURRENCY, async () => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 1))
      inFlight -= 1
    })

    expect(peak).toBe(2)
  })

  it('returns an empty array for an empty input', async () => {
    expect(await mapLimit([], 4, async () => 1)).toEqual([])
  })

  it('propagates mapper rejections', async () => {
    await expect(
      mapLimit([1, 2, 3], 2, async (value) => {
        if (value === 2) {
          throw new Error('boom')
        }
        return value
      }),
    ).rejects.toThrow('boom')
  })
})
