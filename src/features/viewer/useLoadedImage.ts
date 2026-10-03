import { useEffect, useState } from 'react'

interface Loaded {
  url: string
  image: HTMLImageElement
}

/**
 * Load a URL into an `HTMLImageElement` for Konva, returning null until it is
 * ready. The previous image is not returned for a new URL, so a stale frame is
 * never drawn while the next one loads.
 */
export function useLoadedImage(url: string | null): HTMLImageElement | null {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (!url) {
      return
    }
    let cancelled = false
    const element = new Image()
    element.onload = () => {
      if (!cancelled) {
        setLoaded({ url, image: element })
      }
    }
    element.src = url
    return () => {
      cancelled = true
      element.onload = null
    }
  }, [url])

  return loaded && loaded.url === url ? loaded.image : null
}

/** Resolve a dataset-relative path to a URL, ignoring results for stale paths. */
export function useResolvedUrl(
  resolve: (relPath: string) => Promise<string>,
  relPath: string | null,
): string | null {
  const [state, setState] = useState<{ path: string; url: string } | null>(null)

  useEffect(() => {
    if (!relPath) {
      return
    }
    let cancelled = false
    resolve(relPath).then(
      (url) => {
        if (!cancelled) setState({ path: relPath, url })
      },
      () => undefined,
    )
    return () => {
      cancelled = true
    }
  }, [resolve, relPath])

  return state && state.path === relPath ? state.url : null
}
