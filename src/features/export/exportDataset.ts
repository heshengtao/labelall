import type { ExportFormat } from '@/core/formats/losses'
import type { OutputFile } from '@/core/formats/types'
import { writeDataset } from '@/core/formats/write'
import type { DatasetModel } from '@/core/model'
import type { NamedSplit, SplitLayout, SplitRatios } from '@/core/split'
import { partitionDataset } from '@/core/split'
import type { DatasetHandle, DatasetSource } from '@/platform/types'

import { createExportStamp } from './exportStamp'
import { labelsFirstRootFiles, labelsFirstSplit, supportsLabelsFirst } from './labelsFirst'

export interface ExportOptions {
  /** Copy the dataset's images into the export folder so it is self-contained. */
  copyImages: boolean
  /**
   * Partition the dataset into train/val/test before writing. Each split lands
   * in its own subfolder; a weight of `0` leaves that split out entirely.
   * Omitted means a single, unsplit export.
   */
  split?: SplitRatios
  /** How the split folders are arranged. Defaults to `split-first`. */
  layout?: SplitLayout
  /** Seed for the split shuffle, so the same partition can be reproduced. */
  seed?: number
  /**
   * Timestamp folder segment. The dialog passes the one it previewed so the
   * written path matches; when omitted, a fresh one is generated here.
   */
  stamp?: string
  /** 0–1 progress across writing the annotation files and copying the images. */
  onProgress?: (value: number) => void
}

/** Per-split counts, present only when an export was split. */
export interface ExportSplitOutcome {
  split: NamedSplit
  files: number
  images: number
}

export interface ExportOutcome {
  files: number
  images: number
  warnings: string[]
  /** Present only for a split export, in train/val/test order. */
  splits?: ExportSplitOutcome[]
}

/**
 * Collapse a flood of progress callbacks — one per copied image — into at most
 * one per whole percentage point, so the dialog is not re-rendered thousands of
 * times while an export runs.
 */
function createProgressReporter(onProgress?: (value: number) => void): (value: number) => void {
  let last = -1
  return (value) => {
    if (!onProgress) {
      return
    }
    const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)
    if (percent === last) {
      return
    }
    last = percent
    onProgress(percent / 100)
  }
}

/**
 * Write a dataset out in another format.
 *
 * The destination comes from the platform (`source.exportTarget`): desktop puts
 * it in `LabelAll_export/<format>/<timestamp>/` beside the dataset, the browser
 * nests it in the picked folder. The timestamp keeps repeated exports from
 * overwriting each other, the originals are never modified, and the same code
 * path serves both builds.
 *
 * With `copyImages`, the images are copied in too, following the layout's
 * references (COCO `file_name`, VOC `<path>`, YOLO's `images/`↔`labels/` layout,
 * ImageFolder's class folders) so the export is directly usable on its own.
 *
 * With `split`, the images are dealt into train/val/test, each a complete
 * mini-export of its own, so a partially-populated split is a valid result.
 * `layout` chooses whether the split wraps the format's folders or sits inside
 * them.
 */
export async function exportDataset(
  source: DatasetSource,
  handle: DatasetHandle,
  dataset: DatasetModel,
  format: ExportFormat,
  options: ExportOptions,
): Promise<ExportOutcome> {
  const stamp = options.stamp ?? createExportStamp()
  const basePrefix = source.exportTarget(handle, format, stamp).prefix
  const report = createProgressReporter(options.onProgress)

  if (options.split && options.layout === 'labels-first' && supportsLabelsFirst(format)) {
    return exportLabelsFirst(source, handle, basePrefix, dataset, format, options, report)
  }

  const partitions: { split?: NamedSplit; dataset: DatasetModel }[] = options.split
    ? partitionDataset(dataset, options.split, options.seed ?? 0)
    : [{ dataset }]

  report(0.05)
  const warnings: string[] = []
  const splits: ExportSplitOutcome[] = []
  let files = 0
  let images = 0

  const total = Math.max(1, partitions.length)
  for (let index = 0; index < partitions.length; index += 1) {
    const partition = partitions[index]
    const prefix = partition.split ? `${basePrefix}/${partition.split}` : basePrefix
    const result = writeDataset(partition.dataset, format, {
      ...(partition.split ? { splitName: partition.split } : {}),
    })
    warnings.push(...result.warnings)

    await source.writeTexts(
      handle,
      result.files.map((file) => ({ path: `${prefix}/${file.path}`, contents: file.contents })),
    )
    files += result.files.length

    // A writer may rename or relocate images (MindYOLO rewrites them to numeric
    // names); when it does, the copies follow, otherwise they keep their paths.
    const destinations =
      result.images ??
      partition.dataset.images.map((image) => ({ from: image.filePath, to: image.filePath }))
    const copies = options.copyImages ? destinations : []
    if (copies.length > 0) {
      await source.copyImages(handle, copies, prefix, (value) =>
        report(0.05 + ((index + value) / total) * 0.95),
      )
    }
    images += copies.length
    if (partition.split) {
      splits.push({ split: partition.split, files: result.files.length, images: copies.length })
    }
  }

  report(1)
  return splits.length > 0 ? { files, images, warnings, splits } : { files, images, warnings }
}

/**
 * Labels-first export: relocate each split's images into
 * `<container>/<split>/`, then write the per-split labels and, at the root, the
 * one `data.yaml` and `classes.txt` that tie the splits together.
 */
async function exportLabelsFirst(
  source: DatasetSource,
  handle: DatasetHandle,
  basePrefix: string,
  dataset: DatasetModel,
  format: ExportFormat,
  options: ExportOptions,
  report: (value: number) => void,
): Promise<ExportOutcome> {
  const partitions = partitionDataset(dataset, options.split!, options.seed ?? 0).filter(
    (partition): partition is { split: NamedSplit; dataset: DatasetModel } =>
      partition.split !== undefined,
  )

  report(0.05)
  const warnings: string[] = []
  const splits: ExportSplitOutcome[] = []
  let files = 0
  let images = 0

  const total = Math.max(1, partitions.length)
  for (let index = 0; index < partitions.length; index += 1) {
    const { split, dataset: subset } = partitions[index]
    const result = labelsFirstSplit(subset, format, split)
    warnings.push(...result.warnings)

    await source.writeTexts(
      handle,
      result.files.map((file) => ({ path: `${basePrefix}/${file.path}`, contents: file.contents })),
    )
    files += result.files.length

    const copies = options.copyImages ? result.images : []
    if (copies.length > 0) {
      await source.copyImages(handle, copies, basePrefix, (value) =>
        report(0.05 + ((index + value) / total) * 0.9),
      )
    }
    images += copies.length
    splits.push({ split, files: result.files.length, images: copies.length })
  }

  const rootFiles: OutputFile[] = labelsFirstRootFiles(
    dataset,
    format,
    partitions.map((partition) => partition.split),
  )
  if (rootFiles.length > 0) {
    await source.writeTexts(
      handle,
      rootFiles.map((file) => ({ path: `${basePrefix}/${file.path}`, contents: file.contents })),
    )
    files += rootFiles.length
  }

  report(1)
  return { files, images, warnings, splits }
}
