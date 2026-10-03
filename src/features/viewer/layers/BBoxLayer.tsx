import type Konva from 'konva'
import { Rect, Text } from 'react-konva'

import { BOX_EDGES } from '@/core/annotationEdits'

import { AnnotationGroup } from './AnnotationGroup'
import { HANDLE_SIZE, handlePosition } from './handles'
import type { AnnotationLayerProps } from './types'

export function BBoxLayer({
  annotations,
  colorOf,
  nameOf,
  scale,
  selectedIndex,
  hoveredIndex,
  editable,
  moveOffset,
  resize,
  onHover,
  onShapeStart,
  onHandleStart,
}: AnnotationLayerProps) {
  return (
    <>
      {annotations.map(({ annotation, index }) => {
        if (annotation.type !== 'bbox') {
          return null
        }
        // While resizing, draw the live preview box instead of the stored one.
        const box = resize?.index === index ? resize.box : annotation.bbox
        const color = colorOf(annotation.categoryId)
        const selected = selectedIndex === index
        const hovered = hoveredIndex === index
        const width = (selected ? 3 : hovered ? 2.5 : 1.5) / scale
        const offset = moveOffset?.index === index ? { dx: moveOffset.dx, dy: moveOffset.dy } : null

        return (
          <AnnotationGroup
            key={index}
            index={index}
            offset={offset}
            onStart={onShapeStart}
            onEnter={onHover}
            onLeave={() => onHover(null)}
          >
            <Rect
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              stroke={color}
              strokeWidth={width}
              fill={selected ? `${color}22` : undefined}
            />
            {selected || hovered ? (
              <Text
                text={nameOf(annotation.categoryId)}
                x={box.x}
                y={box.y - 16 / scale}
                fontSize={13 / scale}
                fill={color}
                listening={false}
              />
            ) : null}
            {editable && selected
              ? BOX_EDGES.map((edge) => {
                  const position = handlePosition(box, edge)
                  const size = HANDLE_SIZE / scale
                  return (
                    <Rect
                      key={edge}
                      x={position.x - size / 2}
                      y={position.y - size / 2}
                      width={size}
                      height={size}
                      fill="#ffffff"
                      stroke={color}
                      strokeWidth={1 / scale}
                      onMouseDown={(event: Konva.KonvaEventObject<MouseEvent>) => {
                        // Do not let a handle also start a whole-annotation move.
                        event.cancelBubble = true
                        onHandleStart(index, edge)
                      }}
                    />
                  )
                })
              : null}
          </AnnotationGroup>
        )
      })}
    </>
  )
}
