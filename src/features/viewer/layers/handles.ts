import type { BoxEdge } from '@/core/annotationEdits'
import type { BBox, Point } from '@/core/model'

/** Screen-space size of a resize handle, before the zoom correction. */
export const HANDLE_SIZE = 9

/** Where a resize handle sits for a given box edge. */
export function handlePosition(box: BBox, edge: BoxEdge): Point {
  const midX = box.x + box.width / 2
  const midY = box.y + box.height / 2
  const right = box.x + box.width
  const bottom = box.y + box.height
  switch (edge) {
    case 'nw':
      return { x: box.x, y: box.y }
    case 'n':
      return { x: midX, y: box.y }
    case 'ne':
      return { x: right, y: box.y }
    case 'e':
      return { x: right, y: midY }
    case 'se':
      return { x: right, y: bottom }
    case 's':
      return { x: midX, y: bottom }
    case 'sw':
      return { x: box.x, y: bottom }
    case 'w':
      return { x: box.x, y: midY }
  }
}
