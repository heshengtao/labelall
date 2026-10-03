import type { DetectionCandidate } from '@/core/formats/detect'
import type { ParseRequest } from '@/core/formats/dispatch'
import { useDatasetStore } from '@/store/datasetStore'
import type { DatasetSource } from '@/platform/types'
import type { ParseService } from '@/workers/parseClient'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Pick a folder, scan it and detect its format(s). */
export async function beginOpen(source: DatasetSource, parseService: ParseService): Promise<void> {
  const store = useDatasetStore.getState()
  store.setError(null)

  let handle
  try {
    handle = await source.pickDataset()
  } catch (error) {
    store.setStatus('error')
    store.setError(errorMessage(error))
    return
  }
  if (!handle) {
    store.setStatus('idle')
    return
  }

  try {
    store.setStatus('scanning')
    store.setProgress(0.1)
    const files = await source.scan(handle)

    store.setStatus('detecting')
    store.setProgress(0.4)
    const candidates = await parseService.detect(handle, files, (value) =>
      store.setProgress(0.4 + value * 0.5),
    )

    store.setPending({ handle, files, candidates })
    store.setStatus('ready')
    store.setProgress(1)
  } catch (error) {
    store.setStatus('error')
    store.setError(errorMessage(error))
  }
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
    store.setDataset(pending.handle, result.dataset, result.warnings)
    store.setPending(null)
    store.setStatus('idle')
    store.setProgress(1)
  } catch (error) {
    store.setStatus('error')
    store.setError(errorMessage(error))
  }
}

/** Dismiss the detection step without loading anything. */
export function cancelOpen(): void {
  const store = useDatasetStore.getState()
  store.setPending(null)
  store.setStatus('idle')
  store.setProgress(0)
}
