import type { ReactNode } from 'react'

import type Konva from 'konva'
import { Group } from 'react-konva'

export interface AnnotationGroupProps {
  index: number
  /** Render-time translation while the annotation is being dragged. */
  offset: { dx: number; dy: number } | null
  onStart: (index: number) => void
  onEnter: (index: number) => void
  onLeave: () => void
  children: ReactNode
}

/**
 * Wraps one annotation so it can be hovered, selected and dragged as a unit.
 *
 * Dragging is deliberately NOT Konva's `draggable`: a nested draggable node
 * fights the controlled position props, and its `dragend` bubbles up to the pan
 * group and yanks the whole canvas. Instead the pointer is tracked on the stage
 * and this group is simply translated during the drag.
 */
export function AnnotationGroup({
  index,
  offset,
  onStart,
  onEnter,
  onLeave,
  children,
}: AnnotationGroupProps) {
  return (
    <Group
      x={offset?.dx ?? 0}
      y={offset?.dy ?? 0}
      onMouseDown={(event: Konva.KonvaEventObject<MouseEvent>) => {
        event.cancelBubble = true
        onStart(index)
      }}
      onMouseEnter={() => onEnter(index)}
      onMouseLeave={() => onLeave()}
    >
      {children}
    </Group>
  )
}
