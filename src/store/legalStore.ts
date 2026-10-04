import { create } from 'zustand'

import { acceptConsent, needsConsentNotice } from '@/legal/consent'
import { legalRouteFromHash } from '@/legal/route'
import type { LegalDocId } from '@/legal/types'

interface LegalState {
  /** The policy page currently shown, mirrored from the URL hash. */
  route: LegalDocId | null
  /** Whether the bottom storage notice still needs to be acknowledged. */
  noticeOpen: boolean

  setRoute(route: LegalDocId | null): void
  dismissNotice(): void
}

function initialRoute(): LegalDocId | null {
  return typeof window === 'undefined' ? null : legalRouteFromHash(window.location.hash)
}

export const useLegalStore = create<LegalState>((set) => ({
  route: initialRoute(),
  noticeOpen: needsConsentNotice(),

  setRoute: (route) => set({ route }),
  dismissNotice: () => {
    acceptConsent()
    set({ noticeOpen: false })
  },
}))
