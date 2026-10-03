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
 * Files land in `export/<format>/` inside the opened dataset rather than next to
 * the originals: export never overwrites the user's data, and the same code path
 * works for both Tauri and the browser's File System Access API.
 */
export async function exportDataset(
  source: DatasetSource,
  handle: DatasetHandle,
  dataset: DatasetModel,
  format: ExportFormat,
): Promise<ExportOutcome> {
  const result = writeDataset(dataset, format)
  const prefix = `export/${format}/`
  await source.writeTexts(
    handle,
    result.files.map((file) => ({ path: `${prefix}${file.path}`, contents: file.contents })),
  )
  return { files: result.files.length, warnings: result.warnings }
}
