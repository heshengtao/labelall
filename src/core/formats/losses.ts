/**
 * Cross-format conversion losses.
 *
 * The model is richer than any single on-disk format, so exporting always drops
 * something. Rather than let that happen silently, the writers report exactly
 * what they cannot represent and the export dialog shows it before writing.
 */

import type { DatasetModel } from '../model'

/** The format actually written, after resolving an ambiguous choice. */
export type ExportFormat = 'coco' | 'yolo-detect' | 'yolo-seg' | 'yolo-pose' | 'voc' | 'imagefolder'

/** What the user picks in the export dialog. */
export type ExportChoice = 'coco' | 'yolo' | 'voc' | 'imagefolder'

/**
 * Pick the concrete YOLO task for a dataset: pose when it has keypoints, segment
 * when it has polygons, otherwise plain detection.
 */
export function resolveExportFormat(dataset: DatasetModel, choice: ExportChoice): ExportFormat {
  if (choice !== 'yolo') {
    return choice
  }
  if (dataset.annotations.some((annotation) => annotation.type === 'keypoints')) {
    return 'yolo-pose'
  }
  if (dataset.annotations.some((annotation) => annotation.type === 'polygon')) {
    return 'yolo-seg'
  }
  return 'yolo-detect'
}

export function collectLosses(dataset: DatasetModel, format: ExportFormat): string[] {
  const types = new Set(dataset.annotations.map((annotation) => annotation.type))
  const losses: string[] = []

  switch (format) {
    case 'coco':
      if (types.has('classification')) {
        losses.push('Image-level class labels have no COCO equivalent and are skipped.')
      }
      break

    case 'yolo-detect':
      if (types.has('polygon')) losses.push('Polygons are reduced to their bounding box.')
      if (types.has('keypoints')) losses.push('Keypoints are reduced to their bounding box.')
      if (types.has('mask')) losses.push('RLE masks are reduced to their bounding box.')
      if (types.has('classification')) losses.push('Image-level class labels are skipped.')
      losses.push('Annotation ids, areas, scores and attributes are not stored in YOLO labels.')
      break

    case 'yolo-seg':
      if (types.has('keypoints')) losses.push('Keypoints are dropped.')
      if (types.has('mask')) losses.push('RLE masks are reduced to their bounding box.')
      if (types.has('classification')) losses.push('Image-level class labels are skipped.')
      losses.push('Boxes without polygons are written as four-point polygons.')
      break

    case 'yolo-pose':
      if (types.has('polygon')) losses.push('Polygons are reduced to their bounding box.')
      if (types.has('mask')) losses.push('RLE masks are reduced to their bounding box.')
      if (types.has('classification')) losses.push('Image-level class labels are skipped.')
      losses.push('Only keypoints listed in the pose schema are written.')
      break

    case 'voc':
      if (types.has('polygon')) losses.push('Polygons are reduced to their bounding box.')
      if (types.has('keypoints')) losses.push('Keypoints are dropped; VOC has no pose annotations.')
      if (types.has('mask')) losses.push('RLE masks are reduced to their bounding box.')
      if (types.has('classification')) losses.push('Image-level class labels are skipped.')
      losses.push('Supercategories, scores and COCO crowd flags are not stored in VOC.')
      break

    case 'imagefolder':
      if (dataset.annotations.some((annotation) => annotation.type !== 'classification')) {
        losses.push('All geometry (boxes, polygons, keypoints, masks) is dropped.')
      }
      losses.push(
        'Only class names are written; image-to-class assignment relies on the folder layout.',
      )
      break
  }

  return losses
}
