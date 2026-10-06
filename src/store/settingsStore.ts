import { create } from 'zustand'

import type { ExportChoice } from '@/core/formats/losses'
import { DEFAULT_SPLIT_RATIOS, type SplitLayout, type SplitRatios } from '@/core/split'
import { DEFAULT_SEED } from '@/theme/md3'

export interface RecentDataset {
  id: string
  root: string
  displayName: string
  kind: 'tauri' | 'web'
}

/**
 * The export dialog's options as the user last confirmed them. Re-opened on the
 * next export so a repeated export does not have to be reconfigured. Class
 * selection is deliberately excluded: category ids are dataset-specific.
 */
export interface ExportConfig {
  format: ExportChoice
  split: boolean
  ratios: SplitRatios
  seed: string
  layout: SplitLayout
  keepUnmatched: boolean
  copyImages: boolean
}

export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'coco',
  split: false,
  ratios: DEFAULT_SPLIT_RATIOS,
  seed: '0',
  layout: 'split-first',
  keepUnmatched: false,
  copyImages: true,
}

interface SettingsState {
  /** MD3 seed colour for the whole UI. */
  seed: string
  /** Format pre-selected in the export dialog. */
  defaultExportFormat: ExportChoice
  /** Last export dialog options, or `null` before the first export. */
  exportConfig: ExportConfig | null
  /** Recently opened datasets, most recent first. */
  recent: RecentDataset[]
  /** Last image id viewed in each dataset, keyed by dataset handle id. */
  positions: Record<string, number>

  setSeed(seed: string): void
  setDefaultExportFormat(format: ExportChoice): void
  rememberExportConfig(config: ExportConfig): void
  forgetExportConfig(): void
  rememberDataset(entry: RecentDataset): void
  forgetDataset(id: string): void
  rememberPosition(datasetId: string, imageId: number): void
}

const STORAGE_KEY = 'labelall.settings'
const MAX_RECENT = 8

interface Persisted {
  seed: string
  defaultExportFormat: ExportChoice
  exportConfig: ExportConfig | null
  recent: RecentDataset[]
  positions: Record<string, number>
}

const DEFAULTS: Persisted = {
  seed: DEFAULT_SEED,
  defaultExportFormat: 'coco',
  exportConfig: null,
  recent: [],
  positions: {},
}

function loadExportConfig(value: unknown): ExportConfig | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const raw = value as Record<string, unknown>
  const ratios = (raw.ratios ?? {}) as Record<string, unknown>
  const ratio = (key: keyof SplitRatios): number => {
    const entry = ratios[key]
    return typeof entry === 'number' && Number.isFinite(entry)
      ? entry
      : DEFAULT_EXPORT_CONFIG.ratios[key]
  }
  return {
    format:
      typeof raw.format === 'string' ? (raw.format as ExportChoice) : DEFAULT_EXPORT_CONFIG.format,
    split: typeof raw.split === 'boolean' ? raw.split : DEFAULT_EXPORT_CONFIG.split,
    ratios: { train: ratio('train'), val: ratio('val'), test: ratio('test') },
    seed: typeof raw.seed === 'string' ? raw.seed : DEFAULT_EXPORT_CONFIG.seed,
    layout: raw.layout === 'labels-first' ? 'labels-first' : 'split-first',
    keepUnmatched:
      typeof raw.keepUnmatched === 'boolean'
        ? raw.keepUnmatched
        : DEFAULT_EXPORT_CONFIG.keepUnmatched,
    copyImages:
      typeof raw.copyImages === 'boolean' ? raw.copyImages : DEFAULT_EXPORT_CONFIG.copyImages,
  }
}

function loadPositions(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') {
    return {}
  }
  const result: Record<string, number> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      result[key] = entry
    }
  }
  return result
}

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
      exportConfig: loadExportConfig(parsed.exportConfig),
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
      positions: loadPositions(parsed.positions),
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
    const { seed, defaultExportFormat, exportConfig, recent, positions } = get()
    persist({ seed, defaultExportFormat, exportConfig, recent, positions })
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
    rememberExportConfig: (exportConfig) => {
      set({ exportConfig })
      save()
    },
    forgetExportConfig: () => {
      set({ exportConfig: null })
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
      set((state) => {
        const positions = { ...state.positions }
        delete positions[id]
        return { recent: state.recent.filter((item) => item.id !== id), positions }
      })
      save()
    },
    rememberPosition: (datasetId, imageId) => {
      set((state) => ({ positions: { ...state.positions, [datasetId]: imageId } }))
      save()
    },
  }
})
