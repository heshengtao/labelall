import { Circle, Line, Rect, Text } from 'react-konva'

import { AnnotationGroup } from './AnnotationGroup'
import type { AnnotationLayerProps } from './types'

export function KeypointLayer({
  annotations,
  colorOf,
  nameOf,
  schemaOf,
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
        if (annotation.type !== 'keypoints') {
          return null
        }
        const color = colorOf(annotation.categoryId)
        const selected = selectedIndex === index
        const hovered = hoveredIndex === index
        const skeleton = schemaOf(annotation.categoryId)?.skeleton ?? []
        const { bbox, keypoints } = annotation
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

            {/* A keypoint instance has no outline of its own; its bbox doubles as
                the click target and the drag handle. */}
            <Rect
              x={bbox.x}
              y={bbox.y}
              width={bbox.width}
              height={bbox.height}
              stroke={selected || hovered ? color : undefined}
              strokeWidth={selected ? 2 / scale : hovered ? 1.5 / scale : 0}
              fill="rgba(0,0,0,0.001)"
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
          </AnnotationGroup>
        )
      })}
    </>
  )
}
