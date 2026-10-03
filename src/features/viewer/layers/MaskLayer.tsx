import { Rect } from 'react-konva'

import { AnnotationGroup } from './AnnotationGroup'
import { AnnotationLabel } from './AnnotationLabel'
import type { AnnotationLayerProps } from './types'

/**
 * Run-length-encoded masks have no direct Konva equivalent, so a crowd mask is
 * shown as a dashed box plus its label. Decoding RLE to a bitmap is a later
 * refinement; the geometry is at least honest about what it is.
 */
export function MaskLayer({
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
        if (annotation.type !== 'mask' || !annotation.bbox) {
          return null
        }
        const { bbox } = annotation
        const color = colorOf(annotation.categoryId)
        const selected = selectedIndex === index
        const hovered = hoveredIndex === index
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
              x={bbox.x}
              y={bbox.y}
              width={bbox.width}
              height={bbox.height}
              stroke={color}
              strokeWidth={(selected ? 3 : 2) / scale}
              dash={[8 / scale, 6 / scale]}
              fill={selected ? `${color}22` : undefined}
            />
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
