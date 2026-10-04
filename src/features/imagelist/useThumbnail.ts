import { useEffect, useState } from 'react'

import { getThumbnail, type ThumbnailRenderer } from './thumbnail'

/** Resolve a dataset image to a downscaled, cached thumbnail URL. */
export function useThumbnail(
  resolveThumbnail: ThumbnailRenderer,
  relPath: string | null,
  maxEdge: number,
): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!relPath) {
      return
    }
    let cancelled = false
    getThumbnail(relPath, maxEdge, resolveThumbnail).then(
      (value) => {
        if (!cancelled) setUrl(value)
      },
      () => {
        if (!cancelled) setUrl(null)
      },
    )
    return () => {
      cancelled = true
    }
  }, [relPath, maxEdge, resolveThumbnail])

  return url
}
