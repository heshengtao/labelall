import { useEffect } from 'react'

import { useLegalStore } from '@/store/legalStore'

import { legalRouteFromHash } from './route'

/** Keeps the legal route in the store in sync with the URL hash. */
export function useLegalHash(): void {
  const setRoute = useLegalStore((state) => state.setRoute)

  useEffect(() => {
    const sync = (): void => {
      setRoute(legalRouteFromHash(window.location.hash))
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
    }
  }, [setRoute])
}
