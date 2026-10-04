import { beforeEach, describe, expect, it, vi } from 'vitest'

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
