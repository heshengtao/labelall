import { create } from 'zustand'

import type { ExportChoice } from '@/core/formats/losses'
import { DEFAULT_SEED } from '@/theme/md3'

export interface RecentDataset {
  id: string
  root: string
  displayName: string
  kind: 'tauri' | 'web'
}

interface SettingsState {
  /** MD3 seed colour for the whole UI. */
  seed: string
  /** Format pre-selected in the export dialog. */
  defaultExportFormat: ExportChoice
  /** Recently opened datasets, most recent first. */
  recent: RecentDataset[]

  setSeed(seed: string): void
  setDefaultExportFormat(format: ExportChoice): void
  rememberDataset(entry: RecentDataset): void
  forgetDataset(id: string): void
}

const STORAGE_KEY = 'labelall.settings'
const MAX_RECENT = 8

interface Persisted {
  seed: string
  defaultExportFormat: ExportChoice
  recent: RecentDataset[]
}

const DEFAULTS: Persisted = { seed: DEFAULT_SEED, defaultExportFormat: 'coco', recent: [] }

function load(): Persisted {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULTS }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULTS }
    }
    const parsed = JSON.parse(raw) as Partial<Persisted>
    return {
      seed: typeof parsed.seed === 'string' ? parsed.seed : DEFAULTS.seed,
      defaultExportFormat: parsed.defaultExportFormat ?? DEFAULTS.defaultExportFormat,
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function persist(value: Persisted): void {
  if (typeof localStorage === 'undefined') {
    return
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage can be full or blocked; settings are a nicety, not critical.
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const save = (): void => {
    const { seed, defaultExportFormat, recent } = get()
    persist({ seed, defaultExportFormat, recent })
  }

  return {
    ...load(),

    setSeed: (seed) => {
      set({ seed })
      save()
    },
    setDefaultExportFormat: (defaultExportFormat) => {
      set({ defaultExportFormat })
      save()
    },
    rememberDataset: (entry) => {
      set((state) => ({
        recent: [entry, ...state.recent.filter((item) => item.id !== entry.id)].slice(
          0,
          MAX_RECENT,
        ),
      }))
      save()
    },
    forgetDataset: (id) => {
      set((state) => ({ recent: state.recent.filter((item) => item.id !== id) }))
      save()
    },
  }
})
