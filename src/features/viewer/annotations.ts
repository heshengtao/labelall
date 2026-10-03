import type { Annotation, Category } from '@/core/model'

/** The annotations belonging to one image, in file order. */
export function annotationsForImage(
  annotations: readonly Annotation[],
  imageId: number | null,
): Annotation[] {
  if (imageId === null) {
    return []
  }
  return annotations.filter((annotation) => annotation.imageId === imageId)
}

export function categoryColor(category: Category | undefined): string {
  return category?.color ?? '#8a8a8a'
}

export function categoryName(category: Category | undefined): string {
  if (!category) {
    return ''
  }
  return category.displayName ?? category.name
}

/** Index of an image id in the dataset, or -1. */
export function imageIndexOf(ids: readonly number[], imageId: number | null): number {
  if (imageId === null) {
    return -1
  }
  return ids.indexOf(imageId)
}
