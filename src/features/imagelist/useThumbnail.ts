import { useEffect, useState } from 'react'

import { useResolvedUrl } from '@/features/viewer/useLoadedImage'

import { getThumbnail } from './thumbnail'

/** Resolve a dataset image to a downscaled, cached thumbnail URL. */
export function useThumbnail(
  resolveImageUrl: (relPath: string) => Promise<string>,
  relPath: string | null,
  maxEdge: number,
): string | null {
  const baseUrl = useResolvedUrl(resolveImageUrl, relPath)
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!baseUrl || !relPath) {
      return
    }
    let cancelled = false
    getThumbnail(relPath, baseUrl, maxEdge).then(
      (value) => {
        if (!cancelled) setUrl(value)
      },
      () => {
        if (!cancelled) setUrl(baseUrl)
      },
    )
    return () => {
      cancelled = true
    }
  }, [baseUrl, relPath, maxEdge])

  return url
}
