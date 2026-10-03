import { Group, Line, Text } from 'react-konva'
import type Konva from 'konva'

import { bboxFromPolygons } from '@/core/geometry'

import type { AnnotationLayerProps } from './types'

export function PolygonLayer({
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
        if (annotation.type !== 'polygon') {
          return null
        }
        const color = colorOf(annotation.categoryId)
        const selected = selectedIndex === index
        const hovered = hoveredIndex === index
        const width = (selected ? 3 : hovered ? 2.5 : 1.5) / scale
        const bbox = annotation.bbox ?? bboxFromPolygons(annotation.polygons)

        return (
          <Group key={index}>
            {annotation.polygons.map((polygon, polygonIndex) => (
              <Line
                key={polygonIndex}
                points={polygon.flatMap((point) => [point.x, point.y])}
                closed
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
            ))}
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
