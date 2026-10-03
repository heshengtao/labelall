import { Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'

import { BOX_EDGES, type BoxEdge } from '@/core/annotationEdits'

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
  onSelect,
  onHover,
  onMove,
  onResize,
}: AnnotationLayerProps) {
  return (
    <>
      {annotations.map(({ annotation, index }) => {
        if (annotation.type !== 'bbox') {
          return null
        }
        const { bbox } = annotation
        const color = colorOf(annotation.categoryId)
        const selected = selectedIndex === index
        const hovered = hoveredIndex === index
        const width = (selected ? 3 : hovered ? 2.5 : 1.5) / scale

        return (
          <Group
            key={index}
            x={0}
            y={0}
            draggable={editable && selected}
            onClick={(event: Konva.KonvaEventObject<MouseEvent>) => {
              event.cancelBubble = true
              onSelect(index)
            }}
            onMouseEnter={() => onHover(index)}
            onMouseLeave={() => onHover(null)}
            onDragEnd={(event: Konva.KonvaEventObject<DragEvent>) => {
              const { x, y } = event.target.position()
              event.target.position({ x: 0, y: 0 })
              if (x !== 0 || y !== 0) {
                onMove(index, x, y)
              }
            }}
          >
            <Rect
              x={bbox.x}
              y={bbox.y}
              width={bbox.width}
              height={bbox.height}
              stroke={color}
              strokeWidth={width}
              fill={selected ? `${color}22` : undefined}
            />
            {selected || hovered ? (
              <Text
                text={nameOf(annotation.categoryId)}
                x={bbox.x}
                y={bbox.y - 16 / scale}
                fontSize={13 / scale}
                fill={color}
                listening={false}
              />
            ) : null}
            {editable && selected
              ? BOX_EDGES.map((edge: BoxEdge) => {
                  const position = handlePosition(bbox, edge)
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
                      draggable
                      onDragEnd={(event: Konva.KonvaEventObject<DragEvent>) => {
                        onResize(index, edge, {
                          x: event.target.x() + size / 2,
                          y: event.target.y() + size / 2,
                        })
                      }}
                    />
                  )
                })
              : null}
          </Group>
        )
      })}
    </>
  )
}
