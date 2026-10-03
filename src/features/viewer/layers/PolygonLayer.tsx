import { Line } from 'react-konva'

import { bboxFromPolygons } from '@/core/geometry'

import { AnnotationGroup } from './AnnotationGroup'
import { AnnotationLabel } from './AnnotationLabel'
import type { AnnotationLayerProps } from './types'

export function PolygonLayer({
  annotations,
  colorOf,
  nameOf,
  scale,
  selectedIndex,
  hoveredIndex,
  moveOffset,
  onHover,
  onShapeStart,
}: AnnotationLayerProps) {
  return (
    <>
      {annotations.map(({ annotation, index }) => {
        if (annotation.type !== 'polygon') {
          return null
        }
        const color = colorOf(annotation.categoryId)
        const selected = selectedIndex === index
        const hovered = hoveredIndex === index
        const width = (selected ? 3 : hovered ? 2.5 : 1.5) / scale
        const bbox = annotation.bbox ?? bboxFromPolygons(annotation.polygons)
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
            {annotation.polygons.map((polygon, polygonIndex) => (
              <Line
                key={polygonIndex}
                points={polygon.flatMap((point) => [point.x, point.y])}
                closed
                stroke={color}
                strokeWidth={width}
                fill={selected ? `${color}22` : undefined}
              />
            ))}
            {selected || hovered ? (
              <AnnotationLabel
                x={bbox.x}
                y={bbox.y - 2 / scale}
                text={nameOf(annotation.categoryId)}
                color={color}
                scale={scale}
              />
            ) : null}
          </AnnotationGroup>
        )
      })}
    </>
  )
}
