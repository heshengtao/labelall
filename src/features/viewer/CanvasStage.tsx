import { useEffect, useRef, useState } from 'react'

import type Konva from 'konva'
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage } from 'react-konva'

import type { BoxEdge } from '@/core/annotationEdits'
import { bboxFromCorners } from '@/core/geometry'
import type { BBox, KeypointSchema, Point, Polygon } from '@/core/model'

import type { IndexedAnnotation } from './annotations'
import { BBoxLayer } from './layers/BBoxLayer'
import { KeypointLayer } from './layers/KeypointLayer'
import { MaskLayer } from './layers/MaskLayer'
import { PolygonLayer } from './layers/PolygonLayer'
import type { EditorTool, LayerVisibility } from '@/store/uiStore'
import { toImagePoint, type Viewport } from './viewport'

interface BoxDraft {
  start: Point
  end: Point
}

export interface CanvasStageProps {
  image: HTMLImageElement | null
  imageWidth: number
  imageHeight: number
  viewport: Viewport
  annotations: IndexedAnnotation[]
  layers: LayerVisibility
  tool: EditorTool
  activeCategoryId: number | null
  colorOf: (categoryId: number) => string
  nameOf: (categoryId: number) => string
  schemaOf: (categoryId: number) => KeypointSchema | undefined
  selectedIndex: number | null
  onSelect: (index: number | null) => void
  onMove: (index: number, dx: number, dy: number) => void
  onResize: (index: number, edge: BoxEdge, point: Point) => void
  onCreateBBox: (bbox: BBox) => void
  onCreatePolygon: (polygon: Polygon) => void
  onCreateKeypoints: (points: Point[]) => void
  onZoom: (pointer: Point, factor: number) => void
  onPan: (x: number, y: number) => void
  onResizeStage: (size: { width: number; height: number }) => void
}

export function CanvasStage({
  image,
  imageWidth,
  imageHeight,
  viewport,
  annotations,
  layers,
  tool,
  activeCategoryId,
  colorOf,
  nameOf,
  schemaOf,
  selectedIndex,
  onSelect,
  onMove,
  onResize,
  onCreateBBox,
  onCreatePolygon,
  onCreateKeypoints,
  onZoom,
  onPan,
  onResizeStage,
}: CanvasStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [middleHeld, setMiddleHeld] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const [draftBox, setDraftBox] = useState<BoxDraft | null>(null)
  const [draftPolygon, setDraftPolygon] = useState<Point[]>([])
  const [draftKeypoints, setDraftKeypoints] = useState<Point[]>([])

  // Reset any in-progress drawing when the tool or the image changes.
  const draftKey = `${tool}:${activeCategoryId ?? -1}:${imageWidth}x${imageHeight}`
  const [lastDraftKey, setLastDraftKey] = useState(draftKey)
  if (draftKey !== lastDraftKey) {
    setLastDraftKey(draftKey)
    setDraftBox(null)
    setDraftPolygon([])
    setDraftKeypoints([])
  }

  useEffect(() => {
    const element = containerRef.current
    if (!element) {
      return
    }
    const measure = (): void => {
      const next = { width: element.clientWidth, height: element.clientHeight }
      setSize(next)
      onResizeStage(next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [onResizeStage])

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setDraftBox(null)
        setDraftPolygon([])
        setDraftKeypoints([])
      } else if (event.key === 'Backspace' && draftPolygon.length > 0) {
        event.preventDefault()
        setDraftPolygon((previous) => previous.slice(0, -1))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [draftPolygon.length])

  const pointerToImage = (): Point | null => {
    const pointer = stageRef.current?.getPointerPosition()
    return pointer ? toImagePoint(viewport, pointer) : null
  }

  const draftColor = colorOf(activeCategoryId ?? -1)
  const editable = tool === 'select'
  const layerProps = {
    annotations,
    colorOf,
    nameOf,
    schemaOf,
    scale: viewport.scale,
    selectedIndex,
    hoveredIndex,
    editable,
    onSelect,
    onHover: setHoveredIndex,
    onMove,
    onResize,
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
        cursor: spaceHeld || middleHeld ? 'grabbing' : tool === 'select' ? 'default' : 'crosshair',
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
            return
          }
          if (event.evt.button !== 0 || tool !== 'bbox') {
            return
          }
          const point = pointerToImage()
          if (point) {
            setDraftBox({ start: point, end: point })
          }
        }}
        onMouseMove={() => {
          if (!draftBox) {
            return
          }
          const point = pointerToImage()
          if (point) {
            setDraftBox({ start: draftBox.start, end: point })
          }
        }}
        onMouseUp={() => {
          setMiddleHeld(false)
          if (draftBox) {
            const box = bboxFromCorners(
              draftBox.start.x,
              draftBox.start.y,
              draftBox.end.x,
              draftBox.end.y,
            )
            setDraftBox(null)
            if (box.width >= 2 && box.height >= 2) {
              onCreateBBox(box)
            }
          }
        }}
        onClick={(event: Konva.KonvaEventObject<MouseEvent>) => {
          if (tool === 'polygon') {
            const point = pointerToImage()
            if (point) {
              setDraftPolygon((previous) => [...previous, point])
            }
            return
          }
          if (tool === 'keypoint') {
            const point = pointerToImage()
            if (!point) {
              return
            }
            const required = schemaOf(activeCategoryId ?? -1)?.names.length ?? 0
            const next = [...draftKeypoints, point]
            if (required > 0 && next.length >= required) {
              onCreateKeypoints(next)
              setDraftKeypoints([])
            } else {
              setDraftKeypoints(next)
            }
            return
          }
          if (event.target === event.target.getStage()) {
            onSelect(null)
          }
        }}
        onDblClick={() => {
          if (tool === 'polygon' && draftPolygon.length >= 3) {
            onCreatePolygon(draftPolygon)
            setDraftPolygon([])
          }
        }}
      >
        <Layer>
          <Group
            x={viewport.x}
            y={viewport.y}
            scaleX={viewport.scale}
            scaleY={viewport.scale}
            draggable={spaceHeld || middleHeld}
            onDragEnd={(event: Konva.KonvaEventObject<DragEvent>) =>
              onPan(event.target.x(), event.target.y())
            }
          >
            {image ? (
              <KonvaImage image={image} width={imageWidth} height={imageHeight} listening={false} />
            ) : null}

            <Group listening={editable}>
              {layers.mask ? <MaskLayer {...layerProps} /> : null}
              {layers.polygon ? <PolygonLayer {...layerProps} /> : null}
              {layers.bbox ? <BBoxLayer {...layerProps} /> : null}
              {layers.keypoint ? <KeypointLayer {...layerProps} /> : null}
            </Group>

            {draftBox ? (
              <Rect
                x={Math.min(draftBox.start.x, draftBox.end.x)}
                y={Math.min(draftBox.start.y, draftBox.end.y)}
                width={Math.abs(draftBox.end.x - draftBox.start.x)}
                height={Math.abs(draftBox.end.y - draftBox.start.y)}
                stroke={draftColor}
                strokeWidth={1.5 / viewport.scale}
                dash={[6 / viewport.scale, 4 / viewport.scale]}
                listening={false}
              />
            ) : null}

            {draftPolygon.length > 0 ? (
              <Group listening={false}>
                <Line
                  points={draftPolygon.flatMap((point) => [point.x, point.y])}
                  stroke={draftColor}
                  strokeWidth={1.5 / viewport.scale}
                  dash={[6 / viewport.scale, 4 / viewport.scale]}
                  closed={draftPolygon.length >= 3}
                />
                {draftPolygon.map((point, index) => (
                  <Circle
                    key={index}
                    x={point.x}
                    y={point.y}
                    radius={3 / viewport.scale}
                    fill={draftColor}
                  />
                ))}
              </Group>
            ) : null}

            {draftKeypoints.length > 0 ? (
              <Group listening={false}>
                {draftKeypoints.map((point, index) => (
                  <Circle
                    key={index}
                    x={point.x}
                    y={point.y}
                    radius={4 / viewport.scale}
                    fill={draftColor}
                  />
                ))}
              </Group>
            ) : null}
          </Group>
        </Layer>
      </Stage>
    </div>
  )
}
