import { Circle, Group, Line, Rect, Text } from 'react-konva'
import type Konva from 'konva'

import type { AnnotationLayerProps } from './types'

export function KeypointLayer({
  annotations,
  colorOf,
  nameOf,
  schemaOf,
  scale,
  selectedIndex,
  hoveredIndex,
  onSelect,
  onHover,
}: AnnotationLayerProps) {
  return (
    <>
      {annotations.map((annotation, index) => {
        if (annotation.type !== 'keypoints') {
          return null
        }
        const color = colorOf(annotation.categoryId)
        const selected = selectedIndex === index
        const hovered = hoveredIndex === index
        const skeleton = schemaOf(annotation.categoryId)?.skeleton ?? []
        const { bbox, keypoints } = annotation

        return (
          <Group key={index}>
            {skeleton.map(([from, to], skeletonIndex) => {
              // COCO stores skeleton indices 1-based; the keypoint list is 0-based.
              const a = keypoints[from - 1]
              const b = keypoints[to - 1]
              if (!a || !b || a.v === 0 || b.v === 0) {
                return null
              }
              return (
                <Line
                  key={skeletonIndex}
                  points={[a.x, a.y, b.x, b.y]}
                  stroke={color}
                  strokeWidth={2 / scale}
                  listening={false}
                />
              )
            })}

            {keypoints.map((keypoint, keypointIndex) =>
              keypoint.v === 0 ? null : (
                <Circle
                  key={keypointIndex}
                  x={keypoint.x}
                  y={keypoint.y}
                  radius={(keypoint.v === 2 ? 4 : 3) / scale}
                  fill={keypoint.v === 2 ? color : '#ffffff'}
                  stroke={color}
                  strokeWidth={1 / scale}
                  listening={false}
                />
              ),
            )}

            {/* A keypoint instance has no outline of its own; use its bbox as the
                click target so it can still be selected. */}
            <Rect
              x={bbox.x}
              y={bbox.y}
              width={bbox.width}
              height={bbox.height}
              stroke={selected || hovered ? color : undefined}
              strokeWidth={selected ? 2 / scale : hovered ? 1.5 / scale : 0}
              fill="rgba(0,0,0,0.001)"
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
