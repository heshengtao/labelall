/**
 * Lazy, downscaled thumbnails.
 *
 * Dropping a full-resolution photo into a 120px cell makes the browser decode
 * several megapixels per visible tile — slow on scrolling and heavy in memory.
 * This module decodes each thumbnail at a small edge instead, dedupes concurrent
 * requests, bounds how many run at once, and keeps a small LRU of the results so
 * scrolling back is instant.
 */

/** Default number of decoded thumbnails kept before the oldest is evicted. */
export const THUMBNAIL_CACHE_SIZE = 300

/** How many thumbnails may be decoded simultaneously. */
const THUMBNAIL_CONCURRENCY = 6

export interface Thumbnail {
  url: string
  /** Frees the underlying resource when the thumbnail is evicted. */
  revoke?: () => void
}

export type ThumbnailRenderer = (url: string, maxEdge: number) => Promise<Thumbnail>

export interface ThumbnailLoader {
  load(key: string, url: string, maxEdge: number): Promise<string>
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
 * behaviour can be tested without a real canvas.
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
    load(key, url, maxEdge) {
      const cacheKey = `${maxEdge}:${key}`
      const cached = cache.get(cacheKey)
      if (cached) {
        // Refresh the LRU position.
        cache.delete(cacheKey)
        cache.set(cacheKey, cached)
        return cached.then((thumb) => thumb.url)
      }
      const promise = run(() => render(url, maxEdge)).catch<Thumbnail>(() => ({ url }))
      return remember(cacheKey, promise)
    },
    clear() {
      for (const promise of cache.values()) {
        void promise.then((thumb) => thumb.revoke?.()).catch(() => undefined)
      }
      cache.clear()
    },
  }
}

/**
 * Decode `url` at no larger than `maxEdge` on its longest side, returning a
 * small JPEG object URL. Falls back to the original URL wherever the APIs are
 * unavailable (jsdom, older engines) or anything goes wrong.
 */
async function downscale(url: string, maxEdge: number): Promise<Thumbnail> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return { url }
  }
  try {
    const response = await fetch(url)
    const bitmap = await createImageBitmap(await response.blob(), {
      resizeWidth: maxEdge,
      resizeQuality: 'high',
    })
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return { url }
    }
    context.drawImage(bitmap, 0, 0)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((value) => resolve(value), 'image/jpeg', 0.7),
    )
    if (!blob) {
      return { url }
    }
    const objectUrl = URL.createObjectURL(blob)
    return { url: objectUrl, revoke: () => URL.revokeObjectURL(objectUrl) }
  } catch {
    return { url }
  }
}

let sharedLoader: ThumbnailLoader | null = null

function loader(): ThumbnailLoader {
  if (!sharedLoader) {
    sharedLoader = createThumbnailLoader(downscale)
  }
  return sharedLoader
}

/** Resolve a downscaled thumbnail for `url`, cached by `key` and `maxEdge`. */
export function getThumbnail(key: string, url: string, maxEdge: number): Promise<string> {
  return loader().load(key, url, maxEdge)
}

/** Drop every cached thumbnail — called when a different dataset is opened. */
export function clearThumbnailCache(): void {
  sharedLoader?.clear()
}
