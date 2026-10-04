/**
 * Lazy, downscaled thumbnails.
 *
 * The host decodes each thumbnail — natively on desktop, on a canvas in the
 * browser — through `DatasetSource.thumbnail`, so this module only dedupes
 * concurrent requests, bounds how many run at once, and keeps a small LRU of the
 * results so scrolling back is instant.
 */

import type { Thumbnail } from '@/platform/types'

/** Default number of decoded thumbnails kept before the oldest is evicted. */
export const THUMBNAIL_CACHE_SIZE = 300

/**
 * How many thumbnails may be decoded simultaneously. Kept low because each
 * decode briefly holds a full-resolution image in memory.
 */
const THUMBNAIL_CONCURRENCY = 4

export type ThumbnailRenderer = (relPath: string, maxEdge: number) => Promise<Thumbnail>

export interface ThumbnailLoader {
  load(relPath: string, maxEdge: number): Promise<string>
  clear(): void
}

/** A counting semaphore that caps how many tasks run at once. */
function createSemaphore(limit: number): <T>(task: () => Promise<T>) => Promise<T> {
  let active = 0
  const queue: Array<() => void> = []
  const release = (): void => {
    active -= 1
    const next = queue.shift()
    if (next) {
      active += 1
      next()
    }
  }
  return async <T>(task: () => Promise<T>): Promise<T> => {
    if (active < limit) {
      active += 1
    } else {
      await new Promise<void>((resolve) => queue.push(resolve))
    }
    try {
      return await task()
    } finally {
      release()
    }
  }
}

/**
 * Build a loader over an injectable `render`, so the caching and concurrency
 * behaviour can be tested without a real image decoder.
 */
export function createThumbnailLoader(
  render: ThumbnailRenderer,
  limit = THUMBNAIL_CONCURRENCY,
  maxEntries = THUMBNAIL_CACHE_SIZE,
): ThumbnailLoader {
  const run = createSemaphore(limit)
  const cache = new Map<string, Promise<Thumbnail>>()

  const remember = (cacheKey: string, promise: Promise<Thumbnail>): Promise<string> => {
    cache.set(cacheKey, promise)
    if (cache.size > maxEntries) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) {
        const evicted = cache.get(oldest)
        cache.delete(oldest)
        void evicted?.then((thumb) => thumb.revoke?.()).catch(() => undefined)
      }
    }
    return promise.then((thumb) => thumb.url)
  }

  return {
    load(relPath, maxEdge) {
      const cacheKey = `${maxEdge}:${relPath}`
      const cached = cache.get(cacheKey)
      if (cached) {
        // Refresh the LRU position.
        cache.delete(cacheKey)
        cache.set(cacheKey, cached)
        return cached.then((thumb) => thumb.url)
      }
      return remember(
        cacheKey,
        run(() => render(relPath, maxEdge)),
      )
    },
    clear() {
      for (const promise of cache.values()) {
        void promise.then((thumb) => thumb.revoke?.()).catch(() => undefined)
      }
      cache.clear()
    },
  }
}

let sharedLoader: ThumbnailLoader | null = null
let sharedRender: ThumbnailRenderer | null = null

/**
 * Resolve a thumbnail for `relPath`, cached by edge and deduped across callers.
 * A new `render` (i.e. a different dataset) drops the previous cache, since its
 * keys are dataset-relative paths.
 */
export function getThumbnail(
  relPath: string,
  maxEdge: number,
  render: ThumbnailRenderer,
): Promise<string> {
  if (render === sharedRender && sharedLoader) {
    return sharedLoader.load(relPath, maxEdge)
  }
  sharedLoader?.clear()
  const loader = createThumbnailLoader(render)
  sharedLoader = loader
  sharedRender = render
  return loader.load(relPath, maxEdge)
}

/** Drop every cached thumbnail — called when a different dataset is opened. */
export function clearThumbnailCache(): void {
  sharedLoader?.clear()
}
