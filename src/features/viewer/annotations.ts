import type { Annotation, Category } from '@/core/model'

export interface IndexedAnnotation {
  annotation: Annotation
  /** Position in the dataset's annotation array — the editing handle. */
  index: number
}

/** The annotations of one image, each paired with its global index. */
export function annotationsForImage(
  annotations: readonly Annotation[],
  imageId: number | null,
): IndexedAnnotation[] {
  if (imageId === null) {
    return []
  }
  const result: IndexedAnnotation[] = []
  annotations.forEach((annotation, index) => {
    if (annotation.imageId === imageId) {
      result.push({ annotation, index })
    }
  })
  return result
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
