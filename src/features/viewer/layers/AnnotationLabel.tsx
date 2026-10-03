import { Group, Rect, Text } from 'react-konva'

import { estimateTextWidth } from './label'

export interface AnnotationLabelProps {
  /** Left edge of the label. */
  x: number
  /** Bottom edge of the label — it is drawn sitting just above it. */
  y: number
  text: string
  color: string
  scale: number
}

/**
 * The classic annotation chip: a solid category-coloured rectangle with white
 * text, so the name stays legible over any image.
 */
export function AnnotationLabel({ x, y, text, color, scale }: AnnotationLabelProps) {
  const fontSize = 12 / scale
  const paddingX = 5 / scale
  const paddingY = 2 / scale
  const width = estimateTextWidth(text, fontSize) + paddingX * 2
  const height = fontSize + paddingY * 2

  return (
    <Group x={x} y={y - height} listening={false}>
      <Rect width={width} height={height} fill={color} cornerRadius={2 / scale} />
      <Text text={text} x={paddingX} y={paddingY} fontSize={fontSize} fill="#ffffff" />
    </Group>
  )
}
