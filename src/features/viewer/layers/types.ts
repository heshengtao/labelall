import type { BoxEdge } from '@/core/annotationEdits'
import type { KeypointSchema, Point } from '@/core/model'
import type { IndexedAnnotation } from '@/features/viewer/annotations'

export interface AnnotationLayerProps {
  /** The current image's annotations paired with their global indices. */
  annotations: IndexedAnnotation[]
  colorOf: (categoryId: number) => string
  nameOf: (categoryId: number) => string
  schemaOf: (categoryId: number) => KeypointSchema | undefined
  /** Current zoom, so stroke widths and label text stay a constant screen size. */
  scale: number
  selectedIndex: number | null
  hoveredIndex: number | null
  /** Whether the selected annotation may be dragged / resized. */
  editable: boolean
  onSelect: (index: number | null) => void
  onHover: (index: number | null) => void
  onMove: (index: number, dx: number, dy: number) => void
  onResize: (index: number, edge: BoxEdge, point: Point) => void
}
