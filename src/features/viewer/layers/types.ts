import type { BoxEdge } from '@/core/annotationEdits'
import type { BBox, KeypointSchema } from '@/core/model'
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
  /** Whether annotations react to the mouse — only in the select tool. */
  editable: boolean
  /** Live translation (in image units) for the annotation being dragged. */
  moveOffset: { index: number; dx: number; dy: number } | null
  /** Live preview box for the annotation being resized. */
  resize: { index: number; box: BBox } | null
  onHover: (index: number | null) => void
  /** Start dragging an annotation. */
  onShapeStart: (index: number) => void
  /** Start dragging one of a box's resize handles. */
  onHandleStart: (index: number, edge: BoxEdge) => void
}
