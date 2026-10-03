import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyDataset } from '@/core/model'
import type { DatasetSource } from '@/platform/types'
import { useDatasetStore } from '@/store/datasetStore'
import type { ParseService } from '@/workers/parseClient'

import { beginOpen, cancelOpen, confirmOpen } from './openDatasetFlow'

function fakeSource(overrides: Partial<DatasetSource> = {}): DatasetSource {
  return {
    kind: 'web',
    canWrite: false,
    pickDataset: async () => ({ id: 'h', root: '', displayName: 'fixture' }),
    scan: async () => [{ path: 'a.jpg', isDir: false, size: 1 }],
    readText: async () => '',
    writeTexts: async () => {},
    getImageUrl: async () => 'blob:x',
    imageSize: async () => null,
    ...overrides,
  }
}

function fakeParseService(overrides: Partial<ParseService> = {}): ParseService {
  return {
    detect: async () => [{ format: 'imagefolder', confidence: 0.8, reason: 'classes' }],
    parse: async () => ({ dataset: createEmptyDataset('x', 'imagefolder'), warnings: [] }),
    ...overrides,
  }
}

beforeEach(() => {
  useDatasetStore.getState().close()
})

describe('beginOpen', () => {
  it('scans, detects and parks the result as pending', async () => {
    await beginOpen(fakeSource(), fakeParseService())

    const state = useDatasetStore.getState()
    expect(state.pending?.candidates).toHaveLength(1)
    expect(state.pending?.files).toEqual([{ path: 'a.jpg', isDir: false, size: 1 }])
    expect(state.status).toBe('ready')
  })

  it('stays idle when the picker is cancelled', async () => {
    await beginOpen(fakeSource({ pickDataset: async () => null }), fakeParseService())
    const state = useDatasetStore.getState()
    expect(state.pending).toBeNull()
    expect(state.status).toBe('idle')
  })

  it('reports a scan failure in the import report', async () => {
    const source = fakeSource({ scan: async () => Promise.reject(new Error('boom')) })
    await beginOpen(source, fakeParseService())
    const state = useDatasetStore.getState()
    expect(state.status).toBe('idle')
    expect(state.report).toEqual({ severity: 'error', messages: ['boom'] })
  })
})

describe('confirmOpen', () => {
  it('loads the chosen candidate into the store', async () => {
    const service = fakeParseService({
      parse: async () => ({
        dataset: createEmptyDataset('x', 'coco'),
        warnings: ['careful'],
      }),
    })
    await beginOpen(fakeSource(), service)
    const candidate = useDatasetStore.getState().pending?.candidates[0]
    if (!candidate) throw new Error('expected a candidate')

    await confirmOpen(service, candidate)

    const state = useDatasetStore.getState()
    expect(state.dataset?.sourceFormat).toBe('coco')
    expect(state.warnings).toEqual(['careful'])
    expect(state.pending).toBeNull()
    expect(state.status).toBe('idle')
  })

  it('surfaces a parse failure', async () => {
    const service = fakeParseService({ parse: async () => Promise.reject(new Error('bad json')) })
    await beginOpen(fakeSource(), service)
    const candidate = useDatasetStore.getState().pending?.candidates[0]
    if (!candidate) throw new Error('expected a candidate')

    await confirmOpen(service, candidate)
    expect(useDatasetStore.getState().status).toBe('idle')
    expect(useDatasetStore.getState().report).toEqual({
      severity: 'error',
      messages: ['bad json'],
    })
  })

  it('surfaces a lenient import as a warning report', async () => {
    const service = fakeParseService({
      parse: async () => ({
        dataset: createEmptyDataset('x', 'coco'),
        warnings: ['skipped 2 files'],
      }),
    })
    await beginOpen(fakeSource(), service)
    const candidate = useDatasetStore.getState().pending?.candidates[0]
    if (!candidate) throw new Error('expected a candidate')

    await confirmOpen(service, candidate)
    expect(useDatasetStore.getState().report).toEqual({
      severity: 'warning',
      messages: ['skipped 2 files'],
    })
  })
})

describe('cancelOpen', () => {
  it('drops the pending detection', async () => {
    await beginOpen(fakeSource(), fakeParseService())
    cancelOpen()
    expect(useDatasetStore.getState().pending).toBeNull()
    expect(useDatasetStore.getState().status).toBe('idle')
  })
})
