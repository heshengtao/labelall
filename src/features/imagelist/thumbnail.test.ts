import { describe, expect, it } from 'vitest'

import { createThumbnailLoader, type ThumbnailRenderer } from './thumbnail'

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

describe('createThumbnailLoader', () => {
  it('dedupes concurrent requests for the same key', async () => {
    let calls = 0
    const render: ThumbnailRenderer = async (relPath) => {
      calls += 1
      return { url: `${relPath}#small` }
    }
    const loader = createThumbnailLoader(render, 4)

    const [first, second] = await Promise.all([
      loader.load('a.jpg', 128),
      loader.load('a.jpg', 128),
    ])

    expect(calls).toBe(1)
    expect(first).toBe('a.jpg#small')
    expect(second).toBe('a.jpg#small')
  })

  it('keeps separate entries per max edge', async () => {
    let calls = 0
    const render: ThumbnailRenderer = async (relPath, edge) => {
      calls += 1
      return { url: `${relPath}@${edge}` }
    }
    const loader = createThumbnailLoader(render, 4)

    expect(await loader.load('a', 128)).toBe('a@128')
    expect(await loader.load('a', 320)).toBe('a@320')
    expect(calls).toBe(2)
  })

  it('never exceeds the concurrency limit', async () => {
    let inFlight = 0
    let peak = 0
    const render: ThumbnailRenderer = async (relPath) => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await tick()
      inFlight -= 1
      return { url: relPath }
    }
    const loader = createThumbnailLoader(render, 2)

    await Promise.all(Array.from({ length: 8 }, (_, index) => loader.load(`k${index}`, 128)))

    expect(peak).toBeLessThanOrEqual(2)
    expect(peak).toBeGreaterThan(1)
  })

  it('evicts the oldest thumbnail and revokes it', async () => {
    const revoked: string[] = []
    const render: ThumbnailRenderer = async (relPath) => ({
      url: `${relPath}-thumb`,
      revoke: () => revoked.push(relPath),
    })
    const loader = createThumbnailLoader(render, 4, 2)

    await loader.load('a', 128)
    await loader.load('b', 128)
    await loader.load('c', 128)
    await tick()

    expect(revoked).toEqual(['a'])
  })

  it('rejects when the renderer fails', async () => {
    const render: ThumbnailRenderer = async () => {
      throw new Error('no canvas')
    }
    const loader = createThumbnailLoader(render, 4)

    await expect(loader.load('a', 128)).rejects.toThrow('no canvas')
  })

  it('revokes every cached thumbnail on clear', async () => {
    const revoked: string[] = []
    const render: ThumbnailRenderer = async (relPath) => ({
      url: relPath,
      revoke: () => revoked.push(relPath),
    })
    const loader = createThumbnailLoader(render, 4)

    await loader.load('a', 128)
    await loader.load('b', 128)
    loader.clear()
    await tick()

    expect([...revoked].sort()).toEqual(['a', 'b'])
  })
})
