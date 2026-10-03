import type { Annotation, ImageRecord } from '@/core/model'

export interface GridWindowInput {
  columns: number
  rowHeight: number
  scrollTop: number
  viewportHeight: number
  itemCount: number
  overscanRows?: number
}

export interface GridWindow {
  firstRow: number
  lastRow: number
  totalRows: number
  totalHeight: number
  /** Pixel offset the rendered slice must be translated by. */
  offsetY: number
}

/** How many fixed-width columns fit in `width`. Always at least one. */
export function computeColumnCount(
  width: number,
  minColumnWidth: number,
  gap: number,
  padding = 0,
): number {
  const available = width - padding * 2
  if (available <= 0 || minColumnWidth <= 0) {
    return 1
  }
  return Math.max(1, Math.floor((available + gap) / (minColumnWidth + gap)))
}

/** The slice of rows to render for a fixed-size virtualised grid. */
export function computeGridWindow(input: GridWindowInput): GridWindow {
  const { columns, rowHeight, scrollTop, viewportHeight, itemCount } = input
  const overscan = input.overscanRows ?? 2
  const totalRows = rowHeight > 0 ? Math.ceil(itemCount / Math.max(1, columns)) : 0
  const totalHeight = totalRows * rowHeight

  if (totalRows === 0) {
    return { firstRow: 0, lastRow: -1, totalRows: 0, totalHeight: 0, offsetY: 0 }
  }

  const firstVisible = Math.floor(Math.max(0, scrollTop) / rowHeight)
  const lastVisible = Math.floor((Math.max(0, scrollTop) + viewportHeight) / rowHeight)
  const firstRow = Math.max(0, firstVisible - overscan)
  const lastRow = Math.min(totalRows - 1, lastVisible + overscan)

  return { firstRow, lastRow, totalRows, totalHeight, offsetY: firstRow * rowHeight }
}

export interface ImageFilters {
  split: string | 'all'
  categoryId: number | 'all'
  query: string
}

/** Distinct splits present in the dataset, in first-seen order. */
export function collectSplits(images: readonly ImageRecord[]): string[] {
  const splits: string[] = []
  for (const image of images) {
    if (image.split && !splits.includes(image.split)) {
      splits.push(image.split)
    }
  }
  return splits
}

export function filterImages(
  images: readonly ImageRecord[],
  annotations: readonly Annotation[],
  filters: ImageFilters,
): ImageRecord[] {
  const query = filters.query.trim().toLowerCase()

  let categoryImageIds: Set<number> | null = null
  if (filters.categoryId !== 'all') {
    categoryImageIds = new Set<number>()
    for (const annotation of annotations) {
      if (annotation.categoryId === filters.categoryId) {
        categoryImageIds.add(annotation.imageId)
      }
    }
  }

  return images.filter((image) => {
    if (filters.split !== 'all' && image.split !== filters.split) {
      return false
    }
    if (categoryImageIds && !categoryImageIds.has(image.id)) {
      return false
    }
    if (query && !(image.fileName ?? image.filePath).toLowerCase().includes(query)) {
      return false
    }
    return true
  })
}
