import { describe, expect, it } from 'vitest'

import { createThumbnailLoader, type ThumbnailRenderer } from './thumbnail'

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

describe('createThumbnailLoader', () => {
  it('dedupes concurrent requests for the same key', async () => {
    let calls = 0
    const render: ThumbnailRenderer = async (url) => {
      calls += 1
      return { url: `${url}#small` }
    }
    const loader = createThumbnailLoader(render, 4)

    const [first, second] = await Promise.all([
      loader.load('a.jpg', 'url-a', 128),
      loader.load('a.jpg', 'url-a', 128),
    ])

    expect(calls).toBe(1)
    expect(first).toBe('url-a#small')
    expect(second).toBe('url-a#small')
  })

  it('keeps separate entries per max edge', async () => {
    let calls = 0
    const render: ThumbnailRenderer = async (url, edge) => {
      calls += 1
      return { url: `${url}@${edge}` }
    }
    const loader = createThumbnailLoader(render, 4)

    expect(await loader.load('a', 'u', 128)).toBe('u@128')
    expect(await loader.load('a', 'u', 320)).toBe('u@320')
    expect(calls).toBe(2)
  })

  it('never exceeds the concurrency limit', async () => {
    let inFlight = 0
    let peak = 0
    const render: ThumbnailRenderer = async (url) => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await tick()
      inFlight -= 1
      return { url }
    }
    const loader = createThumbnailLoader(render, 2)

    await Promise.all(
      Array.from({ length: 8 }, (_, index) => loader.load(`k${index}`, `u${index}`, 128)),
    )

    expect(peak).toBeLessThanOrEqual(2)
    expect(peak).toBeGreaterThan(1)
  })

  it('evicts the oldest thumbnail and revokes it', async () => {
    const revoked: string[] = []
    const render: ThumbnailRenderer = async (url) => ({
      url: `${url}-thumb`,
      revoke: () => revoked.push(url),
    })
    const loader = createThumbnailLoader(render, 4, 2)

    await loader.load('a', 'a', 128)
    await loader.load('b', 'b', 128)
    await loader.load('c', 'c', 128)
    await tick()

    expect(revoked).toEqual(['a'])
  })

  it('falls back to the original url when rendering fails', async () => {
    const render: ThumbnailRenderer = async () => {
      throw new Error('no canvas')
    }
    const loader = createThumbnailLoader(render, 4)

    expect(await loader.load('a', 'original', 128)).toBe('original')
  })

  it('revokes every cached thumbnail on clear', async () => {
    const revoked: string[] = []
    const render: ThumbnailRenderer = async (url) => ({
      url,
      revoke: () => revoked.push(url),
    })
    const loader = createThumbnailLoader(render, 4)

    await loader.load('a', 'a', 128)
    await loader.load('b', 'b', 128)
    loader.clear()
    await tick()

    expect([...revoked].sort()).toEqual(['a', 'b'])
  })
})
