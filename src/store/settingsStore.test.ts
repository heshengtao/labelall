import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ExportConfig } from './settingsStore'

const STORAGE_KEY = 'labelall.settings'

describe('settingsStore positions', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('remembers the last image per dataset and persists it', async () => {
    const { useSettingsStore } = await import('./settingsStore')
    useSettingsStore.getState().rememberPosition('ds-1', 42)

    expect(useSettingsStore.getState().positions['ds-1']).toBe(42)
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) as string) as {
      positions: Record<string, number>
    }
    expect(parsed.positions['ds-1']).toBe(42)
  })

  it('reloads saved positions and drops malformed entries', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        seed: '#000000',
        defaultExportFormat: 'coco',
        recent: [],
        positions: { good: 3, bad: 'nope', alsoBad: null },
      }),
    )

    const { useSettingsStore } = await import('./settingsStore')
    expect(useSettingsStore.getState().positions).toEqual({ good: 3 })
  })

  it('forgets a dataset history entry and its position together', async () => {
    const { useSettingsStore } = await import('./settingsStore')
    const store = useSettingsStore.getState()
    store.rememberDataset({ id: 'ds-1', root: '/x', displayName: 'x', kind: 'tauri' })
    store.rememberPosition('ds-1', 5)

    useSettingsStore.getState().forgetDataset('ds-1')

    expect(useSettingsStore.getState().recent).toEqual([])
    expect(useSettingsStore.getState().positions['ds-1']).toBeUndefined()
  })
})

describe('settingsStore export config', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  const config: ExportConfig = {
    format: 'voc',
    split: true,
    ratios: { train: 0.8, val: 0.1, test: 0.1 },
    seed: '7',
    layout: 'labels-first',
    keepUnmatched: true,
    copyImages: false,
  }

  it('remembers the last export config and persists it', async () => {
    const { useSettingsStore } = await import('./settingsStore')
    useSettingsStore.getState().rememberExportConfig({ ...config })

    expect(useSettingsStore.getState().exportConfig).toEqual(config)
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) as string) as {
      exportConfig: { format: string; layout: string } | null
    }
    expect(parsed.exportConfig?.format).toBe('voc')
    expect(parsed.exportConfig?.layout).toBe('labels-first')
  })

  it('reloads a saved export config', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        seed: '#000000',
        defaultExportFormat: 'coco',
        exportConfig: config,
        recent: [],
        positions: {},
      }),
    )

    const { useSettingsStore } = await import('./settingsStore')
    expect(useSettingsStore.getState().exportConfig).toEqual(config)
  })

  it('falls back to defaults for a malformed export config', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        seed: '#000000',
        defaultExportFormat: 'coco',
        exportConfig: { split: 'yes', ratios: { train: 'x' }, layout: 'nope' },
        recent: [],
        positions: {},
      }),
    )

    const { useSettingsStore, DEFAULT_EXPORT_CONFIG } = await import('./settingsStore')
    expect(useSettingsStore.getState().exportConfig).toEqual(DEFAULT_EXPORT_CONFIG)
  })

  it('clears the remembered export config when forgotten', async () => {
    const { useSettingsStore } = await import('./settingsStore')
    useSettingsStore.getState().rememberExportConfig({ ...config })
    useSettingsStore.getState().forgetExportConfig()

    expect(useSettingsStore.getState().exportConfig).toBeNull()
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) as string) as {
      exportConfig: unknown
    }
    expect(parsed.exportConfig).toBeNull()
  })
})
