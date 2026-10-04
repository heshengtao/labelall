import { beforeEach, describe, expect, it } from 'vitest'

import type { DatasetHandle, DatasetSource } from '@/platform/types'
import { useDatasetStore } from '@/store/datasetStore'
import { useSaveStore } from '@/store/saveStore'

import { writeSavePlan } from './saveDataset'
import { guardUnsavedChanges } from './useSaveGuards'

const handle: DatasetHandle = { id: 'h', root: '/data/set', displayName: 'set' }

beforeEach(() => {
  useDatasetStore.getState().close()
  useSaveStore.getState().reset()
})

function openDirty(): void {
  useDatasetStore
    .getState()
    .setDataset(
      handle,
      { sourceFormat: 'coco', root: 'set', images: [], categories: [], annotations: [] },
      [],
    )
  useDatasetStore.getState().addCategory('cat')
}

describe('writeSavePlan', () => {
  it('writes files with dataset-relative paths and no export prefix', async () => {
    const writes: { path: string; contents: string }[][] = []
    const source = {
      writeTexts: async (_handle: DatasetHandle, files: { path: string; contents: string }[]) => {
        writes.push(files)
      },
    } as unknown as DatasetSource

    const count = await writeSavePlan(source, handle, [
      { path: 'annotations/instances.json', contents: '{}' },
    ])

    expect(count).toBe(1)
    expect(writes).toEqual([[{ path: 'annotations/instances.json', contents: '{}' }]])
  })
})

describe('guardUnsavedChanges', () => {
  it('proceeds immediately when there is nothing to save', async () => {
    await expect(guardUnsavedChanges()).resolves.toBe(true)
    expect(useSaveStore.getState().unsavedOpen).toBe(false)
  })

  it('opens the prompt when dirty and proceeds when the user saves or discards', async () => {
    openDirty()
    expect(useDatasetStore.getState().dirty).toBe(true)

    const pending = guardUnsavedChanges()
    expect(useSaveStore.getState().unsavedOpen).toBe(true)

    useSaveStore.getState().answerUnsaved(true)
    await expect(pending).resolves.toBe(true)
  })

  it('returns false when the user cancels', async () => {
    openDirty()
    const pending = guardUnsavedChanges()
    useSaveStore.getState().answerUnsaved(false)
    await expect(pending).resolves.toBe(false)
  })
})
