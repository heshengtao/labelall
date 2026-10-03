import type { Annotation, KeypointSchema } from '@/core/model'

export interface AnnotationLayerProps {
  /** The current image's annotations, in order; the array index is the handle. */
  annotations: Annotation[]
  colorOf: (categoryId: number) => string
  nameOf: (categoryId: number) => string
  schemaOf: (categoryId: number) => KeypointSchema | undefined
  /** Current zoom, so stroke widths and label text stay a constant screen size. */
  scale: number
  selectedIndex: number | null
  hoveredIndex: number | null
  onSelect: (index: number | null) => void
  onHover: (index: number | null) => void
}
