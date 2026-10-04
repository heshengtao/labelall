import { create } from 'zustand'

/**
 * Shared state for the save flow.
 *
 * Keeping it here — rather than in a component — lets the window-close handler,
 * the toolbar button and the confirmation dialogs all drive the same operation:
 * a close request and a Ctrl+S are the same save, and either can be the one that
 * opens the "unsaved changes" prompt.
 */
interface SaveState {
  /** A save is writing files; buttons are disabled and show progress. */
  saving: boolean
  /** Whether the "unsaved changes" prompt is open. */
  unsavedOpen: boolean
  /** Whether the "this save is lossy" prompt is open. */
  lossyOpen: boolean
  /** Format losses shown in the lossy prompt. */
  lossyWarnings: string[]

  setSaving(saving: boolean): void
  /** Ask the user whether to save before continuing. Resolves false to cancel. */
  confirmUnsaved(): Promise<boolean>
  answerUnsaved(proceed: boolean): void
  /** Ask the user to confirm a save that cannot represent everything. */
  confirmLossy(warnings: string[]): Promise<boolean>
  answerLossy(proceed: boolean): void
  reset(): void
}

// The resolvers live outside the store: a function in state would make every
// selector that touches it re-run, and nothing needs to render them.
let pendingUnsaved: ((proceed: boolean) => void) | null = null
let pendingLossy: ((proceed: boolean) => void) | null = null

export const useSaveStore = create<SaveState>((set) => ({
  saving: false,
  unsavedOpen: false,
  lossyOpen: false,
  lossyWarnings: [],

  setSaving: (saving) => set({ saving }),

  confirmUnsaved: () =>
    new Promise<boolean>((resolve) => {
      set({ unsavedOpen: true })
      pendingUnsaved = resolve
    }),

  answerUnsaved: (proceed) => {
    const resolve = pendingUnsaved
    pendingUnsaved = null
    set({ unsavedOpen: false })
    resolve?.(proceed)
  },

  confirmLossy: (warnings) =>
    new Promise<boolean>((resolve) => {
      set({ lossyOpen: true, lossyWarnings: warnings })
      pendingLossy = resolve
    }),

  answerLossy: (proceed) => {
    const resolve = pendingLossy
    pendingLossy = null
    set({ lossyOpen: false, lossyWarnings: [] })
    resolve?.(proceed)
  },

  reset: () => set({ saving: false, unsavedOpen: false, lossyOpen: false, lossyWarnings: [] }),
}))
