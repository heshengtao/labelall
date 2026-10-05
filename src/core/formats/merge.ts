/**
 * Merge several parsed datasets into one.
 *
 * Used when a single dataset is spread across multiple files — the classic
 * case being COCO's `instances_train.json` / `instances_val.json` — so each
 * source's images keep their own `split` while ids are renumbered to stay
 * unique. Categories are unioned by name, matching how the per-file readers
 * assign ids, so a class shared by two splits becomes one category.
 */

import type { Annotation, Category, DatasetModel } from '../model'
import { assignCategoryColors } from '../palette'

/**
 * Concatenate `datasets` into a single dataset in the given order.
 *
 * Image and annotation ids are reassigned, and every annotation is remapped
 * onto its dataset's categories. The result inherits metadata (info, licenses,
 * extras, sourceFormat, root) from the first dataset, but deliberately drops
 * `origin`: a merged dataset has no single original layout to save back to.
 */
export function mergeDatasets(datasets: readonly DatasetModel[]): DatasetModel {
  const first = datasets[0]
  if (!first) {
    throw new Error('mergeDatasets needs at least one dataset')
  }
  if (datasets.length === 1) {
    return first
  }

  const categories: Category[] = []
  const categoryIdByName = new Map<string, number>()
  const images: DatasetModel['images'] = []
  const annotations: Annotation[] = []

  for (const dataset of datasets) {
    const localCategory = new Map<number, number>()
    for (const category of dataset.categories) {
      let id = categoryIdByName.get(category.name)
      if (id === undefined) {
        id = categories.length
        categoryIdByName.set(category.name, id)
        categories.push({ ...category, id })
      }
      localCategory.set(category.id, id)
    }

    const localImage = new Map<number, number>()
    for (const image of dataset.images) {
      const id = images.length
      localImage.set(image.id, id)
      images.push({ ...image, id })
    }

    for (const annotation of dataset.annotations) {
      const imageId = localImage.get(annotation.imageId)
      const categoryId = localCategory.get(annotation.categoryId)
      if (imageId === undefined || categoryId === undefined) {
        continue
      }
      annotations.push({ ...annotation, imageId, categoryId })
    }
  }

  const colored = assignCategoryColors(categories)
  return {
    sourceFormat: first.sourceFormat,
    root: first.root,
    images,
    categories: colored,
    annotations,
    classNames: colored.map((category) => category.name),
    ...(first.info ? { info: first.info } : {}),
    ...(first.licenses ? { licenses: first.licenses } : {}),
    ...(first.extras ? { extras: first.extras } : {}),
  }
}
