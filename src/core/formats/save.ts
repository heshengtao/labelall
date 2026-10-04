/**
 * In-place save planning.
 *
 * Unlike export — which always writes into a `LabelAll_export/` copy — saving
 * overwrites the files the dataset was read from. Doing that faithfully needs
 * the layout the reader recorded in `dataset.origin`, because the files on disk
 * do not always follow the canonical layout the export writers assume (VOC XMLs
 * beside their images, a YOLO `data.yaml` that is not named `data.yaml`, a COCO
 * `file_name` relative to an image directory, …).
 *
 * Nothing here touches the filesystem: it returns dataset-relative files and the
 * platform layer writes them over the originals. The writers are the same ones
 * export uses, just pointed at the original paths.
 */

import type { DatasetModel } from '../model'
import { fileStem } from '../path'
import { writeCoco } from './coco'
import { writeLabelme } from './labelme'
import type { OutputFile } from './types'
import { writeVoc } from './voc'
import { writeImageFolder } from './write'
import { writeYolo, type YoloTask } from './yolo'

export interface SavePlan {
  /** Whether this dataset's format can be written back in place at all. */
  supported: boolean
  /** Files to write, with dataset-relative paths, so they overwrite the originals. */
  files: OutputFile[]
  /**
   * Format losses the write would incur. Non-empty means saving is destructive
   * for something, and the UI should confirm before overwriting the originals.
   */
  warnings: string[]
}

function yoloTask(format: DatasetModel['sourceFormat']): YoloTask {
  if (format === 'yolo-seg') return 'seg'
  if (format === 'yolo-pose') return 'pose'
  return 'detect'
}

/**
 * Build the files that write `dataset` back into the layout it was read from.
 *
 * Returns `supported: false` for a format with no writer (`other`), which the UI
 * turns into "use Export instead".
 */
export function planSave(dataset: DatasetModel): SavePlan {
  const origin = dataset.origin

  switch (dataset.sourceFormat) {
    case 'coco': {
      const result = writeCoco(dataset, {
        ...(origin?.annotationPath ? { path: origin.annotationPath } : {}),
        ...(origin?.imageDir ? { imageDir: origin.imageDir } : {}),
      })
      return { supported: true, ...result }
    }

    case 'voc': {
      const result = writeVoc(dataset, {
        ...(origin?.boxPolicy ? { boxPolicy: origin.boxPolicy } : {}),
        pathFor: (image) => image.annotationPath ?? `Annotations/${fileStem(image.filePath)}.xml`,
      })
      return { supported: true, ...result }
    }

    case 'yolo':
    case 'yolo-seg':
    case 'yolo-pose': {
      const labelled = new Set(origin?.labelledImageIds ?? [])
      const result = writeYolo(dataset, yoloTask(dataset.sourceFormat), {
        ...(origin?.yamlPath ? { yamlPath: origin.yamlPath } : {}),
        emitEmptyFor: (image) => labelled.has(image.id),
      })
      return { supported: true, ...result }
    }

    case 'labelme': {
      const result = writeLabelme(dataset, {
        ...(origin?.imageDir ? { imageDir: origin.imageDir } : {}),
      })
      return { supported: true, ...result }
    }

    case 'imagefolder': {
      // The folder layout *is* the label, so all that can be rewritten in place
      // is the class order (`classes.txt`); changing an image's class would mean
      // moving the file, which save does not do.
      const result = writeImageFolder(dataset)
      return {
        supported: true,
        files: result.files,
        warnings: [
          ...result.warnings,
          'Only the class list is rewritten; images are not moved between class folders.',
        ],
      }
    }

    default:
      return { supported: false, files: [], warnings: [] }
  }
}
