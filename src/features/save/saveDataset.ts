import { planSave } from '@/core/formats/save'
import { getDatasetSource } from '@/platform'
import type { DatasetHandle, DatasetSource } from '@/platform/types'
import { useDatasetStore } from '@/store/datasetStore'
import { useSaveStore } from '@/store/saveStore'

export type SaveResult =
  | { status: 'saved'; files: number }
  | { status: 'noDataset' }
  | { status: 'readOnly' }
  | { status: 'unsupported' }
  | { status: 'cancelled' }
  | { status: 'error'; message: string }

/**
 * Write a save plan's files back over the originals.
 *
 * Paths are dataset-relative and carry no export prefix, which is what makes
 * this overwrite the source files rather than write a copy.
 */
export async function writeSavePlan(
  source: DatasetSource,
  handle: DatasetHandle,
  files: { path: string; contents: string }[],
): Promise<number> {
  await source.writeTexts(handle, files)
  return files.length
}

/**
 * Save the open dataset back to the files it was read from.
 *
 * Unlike export this overwrites the originals, so a write that cannot represent
 * everything asks for confirmation first.
 */
export async function saveCurrentDataset(): Promise<SaveResult> {
  const { dataset, handle } = useDatasetStore.getState()
  if (!dataset || !handle) {
    return { status: 'noDataset' }
  }

  const source = getDatasetSource()
  if (!source.canWrite) {
    return { status: 'readOnly' }
  }

  const plan = planSave(dataset)
  if (!plan.supported) {
    return { status: 'unsupported' }
  }

  if (plan.warnings.length > 0) {
    const proceed = await useSaveStore.getState().confirmLossy(plan.warnings)
    if (!proceed) {
      return { status: 'cancelled' }
    }
  }

  useSaveStore.getState().setSaving(true)
  try {
    const files = await writeSavePlan(source, handle, plan.files)
    // Clear the unsaved indicator only when the content we just wrote is still
    // the content in the store — an edit during the write keeps it dirty.
    if (useDatasetStore.getState().dataset === dataset) {
      useDatasetStore.getState().markSaved()
    }
    return { status: 'saved', files }
  } catch (cause) {
    return { status: 'error', message: cause instanceof Error ? cause.message : String(cause) }
  } finally {
    useSaveStore.getState().setSaving(false)
  }
}
