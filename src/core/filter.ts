/**
 * Category-subset export.
 *
 * Exporting is a pure, in-memory operation until the platform layer writes the
 * files out, so selecting a handful of classes is just a matter of building a
 * smaller `DatasetModel` and handing it to the existing writers. Nothing here
 * touches the filesystem or mutates its input.
 */

import type { DatasetModel } from './model'

export interface CategorySubsetOptions {
  /** Category ids to keep. An empty set keeps no categories. */
  categoryIds: ReadonlySet<number>
  /** `true` keeps images with none of the selected classes (negative samples). */
  keepUnmatchedImages: boolean
}

/**
 * Copy of `dataset` holding only the selected categories and their annotations.
 *
 * - `categories` keeps just the selected ids.
 * - `annotations` keeps just the ones whose category was selected.
 * - `images` keeps every image when `keepUnmatchedImages` is set, otherwise only
 *   images that still have at least one retained annotation.
 * - `classNames` is rebuilt in the retained category order, which keeps
 *   ImageFolder's `classes.txt` and YOLO's re-indexing consistent with the subset.
 */
export function subsetByCategories(
  dataset: DatasetModel,
  options: CategorySubsetOptions,
): DatasetModel {
  const { categoryIds, keepUnmatchedImages } = options
  const categories = dataset.categories.filter((category) => categoryIds.has(category.id))
  const annotations = dataset.annotations.filter((annotation) =>
    categoryIds.has(annotation.categoryId),
  )
  const images = keepUnmatchedImages
    ? dataset.images
    : dataset.images.filter((image) =>
        annotations.some((annotation) => annotation.imageId === image.id),
      )

  return {
    ...dataset,
    categories,
    annotations,
    images,
    classNames: categories.map((category) => category.name),
  }
}

/** How many annotations each category carries, for the export dialog's counts. */
export function annotationCountByCategory(dataset: DatasetModel): Map<number, number> {
  const counts = new Map<number, number>()
  for (const annotation of dataset.annotations) {
    counts.set(annotation.categoryId, (counts.get(annotation.categoryId) ?? 0) + 1)
  }
  return counts
}
