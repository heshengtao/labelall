import type { DetectionCandidate } from '@/core/formats/detect'
import type { ParseRequest } from '@/core/formats/dispatch'
import type { DatasetHandle, DatasetSource } from '@/platform/types'
import { useDatasetStore } from '@/store/datasetStore'
import type { ParseService } from '@/workers/parseClient'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function aborted(generation: number): boolean {
  return useDatasetStore.getState().generation !== generation
}

async function scanAndDetect(
  source: DatasetSource,
  parseService: ParseService,
  handle: DatasetHandle,
  generation: number,
): Promise<void> {
  const store = useDatasetStore.getState()
  try {
    store.setStatus('scanning')
    store.setProgress(0.1)
    const files = await source.scan(handle)
    if (aborted(generation)) {
      return
    }

    store.setStatus('detecting')
    store.setProgress(0.4)
    const candidates = await parseService.detect(handle, files, (value) =>
      store.setProgress(0.4 + value * 0.5),
    )
    if (aborted(generation)) {
      return
    }

    store.setPending({ handle, files, candidates })
    store.setStatus('ready')
    store.setProgress(1)
  } catch (error) {
    if (!aborted(generation)) {
      store.setStatus('idle')
      store.setReport({ severity: 'error', messages: [errorMessage(error)] })
    }
  }
}

/** Pick a folder, scan it and detect its format(s). */
export async function beginOpen(source: DatasetSource, parseService: ParseService): Promise<void> {
  const store = useDatasetStore.getState()
  store.setReport(null)

  let handle: DatasetHandle | null
  try {
    handle = await source.pickDataset()
  } catch (error) {
    store.setStatus('idle')
    store.setReport({ severity: 'error', messages: [errorMessage(error)] })
    return
  }
  if (!handle) {
    store.setStatus('idle')
    return
  }

  await scanAndDetect(source, parseService, handle, useDatasetStore.getState().generation)
}

/** Scan and detect a dataset that is already known — used for "recent". */
export async function openHandle(
  source: DatasetSource,
  parseService: ParseService,
  handle: DatasetHandle,
): Promise<void> {
  const store = useDatasetStore.getState()
  store.setReport(null)
  await scanAndDetect(source, parseService, handle, store.generation)
}

/** Parse the chosen candidate into a full dataset. */
export async function confirmOpen(
  parseService: ParseService,
  candidate: DetectionCandidate,
): Promise<void> {
  const store = useDatasetStore.getState()
  const pending = store.pending
  if (!pending) {
    return
  }
  const generation = store.generation

  try {
    store.setStatus('parsing')
    store.setProgress(0.1)
    const request: ParseRequest = {
      format: candidate.format,
      files: pending.files,
      ...(candidate.params ? { params: candidate.params } : {}),
    }
    const result = await parseService.parse(pending.handle, request, (value) =>
      store.setProgress(value),
    )
    if (aborted(generation)) {
      return
    }
    store.setDataset(pending.handle, result.dataset, result.warnings)
    store.setPending(null)
    store.setStatus('idle')
    store.setProgress(1)
    // A lenient import that skipped something explains itself in a dialog.
    store.setReport(
      result.warnings.length > 0 ? { severity: 'warning', messages: result.warnings } : null,
    )
  } catch (error) {
    if (!aborted(generation)) {
      store.setStatus('idle')
      store.setReport({ severity: 'error', messages: [errorMessage(error)] })
    }
  }
}

/** Abandon whatever the open flow is doing and go back to idle. */
export function cancelOpen(): void {
  const store = useDatasetStore.getState()
  store.invalidateOpen()
  store.setPending(null)
  store.setStatus('idle')
  store.setProgress(0)
}
