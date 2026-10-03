import { Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'

import type { AnnotationLayerProps } from './types'

function strokeWidth(selected: boolean, hovered: boolean): number {
  return selected ? 3 : hovered ? 2.5 : 1.5
}

export function BBoxLayer({
  annotations,
  colorOf,
  nameOf,
  scale,
  selectedIndex,
  hoveredIndex,
  onSelect,
  onHover,
}: AnnotationLayerProps) {
  return (
    <>
      {annotations.map((annotation, index) => {
        if (annotation.type !== 'bbox') {
          return null
        }
        const { bbox } = annotation
        const color = colorOf(annotation.categoryId)
        const selected = selectedIndex === index
        const hovered = hoveredIndex === index
        const width = strokeWidth(selected, hovered) / scale

        return (
          <Group key={index}>
            <Rect
              x={bbox.x}
              y={bbox.y}
              width={bbox.width}
              height={bbox.height}
              stroke={color}
              strokeWidth={width}
              fill={selected ? `${color}22` : undefined}
              onClick={(event: Konva.KonvaEventObject<MouseEvent>) => {
                event.cancelBubble = true
                onSelect(index)
              }}
              onMouseEnter={() => onHover(index)}
              onMouseLeave={() => onHover(null)}
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
          </Group>
        )
      })}
    </>
  )
}
