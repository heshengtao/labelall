/**
 * Category colours.
 *
 * A fixed qualitative palette keeps annotations distinguishable without needing
 * a legend, and deriving the colour from the category index means the same
 * dataset always looks the same across sessions. Colours are chosen to stay
 * legible on both light and dark MD3 surfaces.
 */
export const PALETTE = [
  '#e5484d',
  '#0091ff',
  '#30a46c',
  '#f76b15',
  '#8e4ec6',
  '#e93d82',
  '#12a594',
  '#ffb224',
  '#3e63dd',
  '#d6409f',
  '#46a758',
  '#ff8b3d',
  '#6e56cf',
  '#0588f0',
  '#e54d2e',
  '#29a383',
] as const

export function colorForIndex(index: number): string {
  const normalized = ((index % PALETTE.length) + PALETTE.length) % PALETTE.length
  return PALETTE[normalized]
}

/** Assign colours to categories that do not already carry one. */
export function assignCategoryColors<T extends { id: number; color?: string }>(
  categories: readonly T[],
): T[] {
  return categories.map((category, index) =>
    category.color ? category : { ...category, color: colorForIndex(index) },
  )
}
