import type { ExportFormat } from '@/core/formats/losses'
import { writeDataset } from '@/core/formats/write'
import type { DatasetModel } from '@/core/model'
import type { DatasetHandle, DatasetSource } from '@/platform/types'

export interface ExportOutcome {
  files: number
  warnings: string[]
}

/**
 * Write a dataset out in another format.
 *
 * The destination comes from the platform (`source.exportTarget`): desktop puts
 * it in a `LabelAll_export` folder beside the dataset, the browser nests it in
 * the picked folder. Either way the originals are never overwritten, and the
 * same code path serves both builds.
 */
export async function exportDataset(
  source: DatasetSource,
  handle: DatasetHandle,
  dataset: DatasetModel,
  format: ExportFormat,
): Promise<ExportOutcome> {
  const result = writeDataset(dataset, format)
  const prefix = source.exportTarget(handle, format).prefix
  await source.writeTexts(
    handle,
    result.files.map((file) => ({ path: `${prefix}/${file.path}`, contents: file.contents })),
  )
  return { files: result.files.length, warnings: result.warnings }
}
