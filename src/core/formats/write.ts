/**
 * Writer dispatch: turn a dataset into the text files of a target format.
 *
 * Nothing here touches the filesystem — it returns `OutputFile`s and lets the
 * platform layer decide where to put them, which is what keeps the desktop and
 * web builds on the same code path.
 */

import type { DatasetModel } from '../model'
import { writeCoco } from './coco'
import type { ExportFormat } from './losses'
import type { WriteResult } from './types'
import { writeVoc } from './voc'
import { writeYolo } from './yolo'

/**
 * ImageFolder has no annotation files at all: the layout carries the labels, so
 * all we can usefully emit is the class order.
 */
export function writeImageFolder(dataset: DatasetModel): WriteResult {
  const names =
    dataset.classNames && dataset.classNames.length > 0
      ? dataset.classNames
      : dataset.categories.map((category) => category.name)
  return {
    files: [{ path: 'classes.txt', contents: `${names.join('\n')}\n` }],
    warnings: [],
  }
}

export function writeDataset(dataset: DatasetModel, format: ExportFormat): WriteResult {
  switch (format) {
    case 'coco':
      return writeCoco(dataset)
    case 'voc':
      return writeVoc(dataset)
    case 'yolo-detect':
      return writeYolo(dataset, 'detect')
    case 'yolo-seg':
      return writeYolo(dataset, 'seg')
    case 'yolo-pose':
      return writeYolo(dataset, 'pose')
    case 'imagefolder':
      return writeImageFolder(dataset)
  }
}
