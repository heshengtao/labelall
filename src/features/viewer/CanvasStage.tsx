import { useEffect, useRef, useState } from 'react'

import type Konva from 'konva'
import { Group, Image as KonvaImage, Layer, Stage } from 'react-konva'

import type { Annotation, KeypointSchema } from '@/core/model'
import type { LayerVisibility } from '@/store/uiStore'

import { BBoxLayer } from './layers/BBoxLayer'
import { KeypointLayer } from './layers/KeypointLayer'
import { MaskLayer } from './layers/MaskLayer'
import { PolygonLayer } from './layers/PolygonLayer'
import type { Viewport } from './viewport'

export interface CanvasStageProps {
  image: HTMLImageElement | null
  imageWidth: number
  imageHeight: number
  viewport: Viewport
  annotations: Annotation[]
  layers: LayerVisibility
  colorOf: (categoryId: number) => string
  nameOf: (categoryId: number) => string
  schemaOf: (categoryId: number) => KeypointSchema | undefined
  selectedIndex: number | null
  onSelect: (index: number | null) => void
  onZoom: (pointer: { x: number; y: number }, factor: number) => void
  onPan: (x: number, y: number) => void
  onResize: (size: { width: number; height: number }) => void
}

export function CanvasStage({
  image,
  imageWidth,
  imageHeight,
  viewport,
  annotations,
  layers,
  colorOf,
  nameOf,
  schemaOf,
  selectedIndex,
  onSelect,
  onZoom,
  onPan,
  onResize,
}: CanvasStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [middleHeld, setMiddleHeld] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) {
      return
    }
    const measure = (): void => {
      const next = { width: element.clientWidth, height: element.clientHeight }
      setSize(next)
      onResize(next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [onResize])

  useEffect(() => {
    const down = (event: KeyboardEvent): void => {
      if (event.code === 'Space') {
        setSpaceHeld(true)
      }
    }
    const up = (event: KeyboardEvent): void => {
      if (event.code === 'Space') {
        setSpaceHeld(false)
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const panEnabled = spaceHeld || middleHeld
  const layerProps = {
    annotations,
    colorOf,
    nameOf,
    schemaOf,
    scale: viewport.scale,
    selectedIndex,
    hoveredIndex,
    onSelect,
    onHover: setHoveredIndex,
  }

  return (
    <div
      ref={containerRef}
      data-testid="canvas-stage"
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        cursor: panEnabled ? 'grabbing' : 'default',
      }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onWheel={(event: Konva.KonvaEventObject<WheelEvent>) => {
          event.evt.preventDefault()
          const pointer = stageRef.current?.getPointerPosition() ?? { x: 0, y: 0 }
          onZoom(pointer, event.evt.deltaY < 0 ? 1.1 : 1 / 1.1)
        }}
        onMouseDown={(event: Konva.KonvaEventObject<MouseEvent>) => {
          if (event.evt.button === 1) {
            setMiddleHeld(true)
          }
        }}
        onMouseUp={() => setMiddleHeld(false)}
        onClick={(event: Konva.KonvaEventObject<MouseEvent>) => {
          if (event.target === event.target.getStage()) {
            onSelect(null)
          }
        }}
      >
        <Layer>
          <Group
            x={viewport.x}
            y={viewport.y}
            scaleX={viewport.scale}
            scaleY={viewport.scale}
            draggable={panEnabled}
            onDragEnd={(event: Konva.KonvaEventObject<DragEvent>) =>
              onPan(event.target.x(), event.target.y())
            }
          >
            {image ? (
              <KonvaImage image={image} width={imageWidth} height={imageHeight} listening={false} />
            ) : null}
            {layers.mask ? <MaskLayer {...layerProps} /> : null}
            {layers.polygon ? <PolygonLayer {...layerProps} /> : null}
            {layers.bbox ? <BBoxLayer {...layerProps} /> : null}
            {layers.keypoint ? <KeypointLayer {...layerProps} /> : null}
          </Group>
        </Layer>
      </Stage>
    </div>
  )
}
