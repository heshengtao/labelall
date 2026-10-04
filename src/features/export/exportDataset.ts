import type { ExportFormat } from '@/core/formats/losses'
import { writeDataset } from '@/core/formats/write'
import type { DatasetModel } from '@/core/model'
import type { DatasetHandle, DatasetSource } from '@/platform/types'

export interface ExportOptions {
  /** Copy the dataset's images into the export folder so it is self-contained. */
  copyImages: boolean
  /** 0–1 progress across writing the annotation files and copying the images. */
  onProgress?: (value: number) => void
}

export interface ExportOutcome {
  files: number
  images: number
  warnings: string[]
}

/**
 * Write a dataset out in another format.
 *
 * The destination comes from the platform (`source.exportTarget`): desktop puts
 * it in a `LabelAll_export` folder beside the dataset, the browser nests it in
 * the picked folder. Either way the originals are never overwritten, and the
 * same code path serves both builds.
 *
 * With `copyImages`, the images are copied in too, preserving their relative
 * paths so every format's references (COCO `file_name`, VOC `<path>`, YOLO's
 * `images/`↔`labels/` layout, ImageFolder's class folders) still resolve — which
 * makes the exported folder directly usable on its own.
 */
export async function exportDataset(
  source: DatasetSource,
  handle: DatasetHandle,
  dataset: DatasetModel,
  format: ExportFormat,
  options: ExportOptions,
): Promise<ExportOutcome> {
  const result = writeDataset(dataset, format)
  const prefix = source.exportTarget(handle, format).prefix

  options.onProgress?.(0.05)
  await source.writeTexts(
    handle,
    result.files.map((file) => ({ path: `${prefix}/${file.path}`, contents: file.contents })),
  )
  options.onProgress?.(0.1)

  const paths = options.copyImages ? dataset.images.map((image) => image.filePath) : []
  if (paths.length > 0) {
    await source.copyImages(handle, paths, prefix, (value) =>
      options.onProgress?.(0.1 + value * 0.9),
    )
  } else {
    options.onProgress?.(1)
  }

  return { files: result.files.length, images: paths.length, warnings: result.warnings }
}
