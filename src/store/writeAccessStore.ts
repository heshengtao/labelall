import { create } from 'zustand'

import { getDatasetSource } from '@/platform'
import type { DatasetHandle, WritePermission } from '@/platform/types'

/**
 * Tracks whether the open dataset can actually be written to.
 *
 * `DatasetSource.canWrite` only says whether the host *has* a writable API; a
 * browser can still hand back a read-only directory handle (the "view files"
 * option in Chrome's folder prompt). This store holds the real permission so the
 * UI can offer to escalate it, and stays in sync after a denied write.
 */
interface WriteAccessState {
  /** Permission of the open handle; `unsupported` when no dataset is open. */
  permission: WritePermission
  /** A permission query is in flight. */
  checking: boolean
  /** The browser's permission prompt is open. */
  requesting: boolean
  /** Re-read the permission of the given handle. */
  refresh(handle: DatasetHandle | null): Promise<void>
  /**
   * Ask the host for write access. Must be called from a user gesture, which is
   * the only time the browser shows its permission prompt.
   */
  request(handle: DatasetHandle): Promise<boolean>
}

export const useWriteAccessStore = create<WriteAccessState>((set) => ({
  // Optimistic default so the desktop build never flashes a "grant" affordance;
  // App refreshes it as soon as a dataset handle is available.
  permission: 'granted',
  checking: false,
  requesting: false,

  async refresh(handle) {
    if (!handle) {
      set({ permission: 'unsupported', checking: false })
      return
    }
    set({ checking: true })
    try {
      const permission = await getDatasetSource().queryWritePermission(handle)
      set({ permission, checking: false })
    } catch {
      set({ permission: 'unsupported', checking: false })
    }
  },

  async request(handle) {
    set({ requesting: true })
    try {
      const granted = await getDatasetSource().requestWritePermission(handle)
      if (granted) {
        set({ permission: 'granted' })
      }
      return granted
    } finally {
      set({ requesting: false })
    }
  },
}))
