import { Group, Rect, Text } from 'react-konva'
import type Konva from 'konva'

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
  onSelect,
  onHover,
}: AnnotationLayerProps) {
  return (
    <>
      {annotations.map((annotation, index) => {
        if (annotation.type !== 'mask' || !annotation.bbox) {
          return null
        }
        const { bbox } = annotation
        const color = colorOf(annotation.categoryId)
        const selected = selectedIndex === index
        const hovered = hoveredIndex === index

        return (
          <Group key={index}>
            <Rect
              x={bbox.x}
              y={bbox.y}
              width={bbox.width}
              height={bbox.height}
              stroke={color}
              strokeWidth={(selected ? 3 : 2) / scale}
              dash={[8 / scale, 6 / scale]}
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
