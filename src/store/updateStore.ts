import type { Update } from '@tauri-apps/plugin-updater'
import { create } from 'zustand'

export type UpdateStatus =
  'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'current' | 'error'

interface UpdateState {
  status: UpdateStatus
  /** Version being offered, or the app version after a "you're up to date" check. */
  version: string | null
  notes: string | null
  /** 0–1 while downloading. */
  progress: number
  error: string | null

  checkForUpdates(options?: { silent?: boolean }): Promise<void>
  installUpdate(): Promise<void>
  dismiss(): void
}

/** The update the plugin returned; kept out of the store so it is not serialised. */
let pending: Update | null = null

/**
 * Auto-update, desktop only.
 *
 * The Tauri plugins are imported lazily so the web build never touches them, and
 * a silent check on startup only opens the dialog when there is something to say.
 */
export const useUpdateStore = create<UpdateState>((set) => ({
  status: 'idle',
  version: null,
  notes: null,
  progress: 0,
  error: null,

  checkForUpdates: async ({ silent = false } = {}) => {
    const { isTauri } = await import('@/platform/detect-env')
    if (!isTauri()) {
      if (!silent) {
        set({ status: 'error', error: 'desktop-only' })
      }
      return
    }

    set({ status: 'checking', error: null })
    try {
      const { check } = await import('@tauri-apps/plugin-updater')
      const update = await check()
      if (!update) {
        pending = null
        set({ status: silent ? 'idle' : 'current', version: null, notes: null })
        return
      }
      pending = update
      set({
        status: 'available',
        version: update.version,
        notes: update.body ?? null,
        progress: 0,
      })
    } catch (error) {
      if (silent) {
        set({ status: 'idle' })
      } else {
        set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
      }
    }
  },

  installUpdate: async () => {
    if (!pending) {
      return
    }
    set({ status: 'downloading', progress: 0, error: null })
    try {
      let total = 0
      let downloaded = 0
      await pending.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength ?? 0
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength
          set({ progress: total > 0 ? Math.min(1, downloaded / total) : 0 })
        }
      })
      set({ status: 'ready', progress: 1 })
      const { relaunch } = await import('@tauri-apps/plugin-process')
      await relaunch()
    } catch (error) {
      set({ status: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  },

  dismiss: () => set({ status: 'idle', error: null, progress: 0 }),
}))
