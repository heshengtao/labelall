import { useCallback, useMemo, useState } from 'react'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FitScreenIcon from '@mui/icons-material/FitScreen'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import {
  Box,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import {
  clampAnnotation,
  constrainTranslation,
  resizeBBox,
  translateAnnotation,
  type BoxEdge,
} from '@/core/annotationEdits'
import { bboxArea, bboxFromPoints, bboxFromPolygons, clampBBox, polygonArea } from '@/core/geometry'
import type { BBox, DatasetModel, Point, Polygon } from '@/core/model'
import { AnnotateToolbar } from '@/features/annotate/AnnotateToolbar'
import { useEditorShortcuts } from '@/features/annotate/useEditorShortcuts'
import type { ThumbnailRenderer } from '@/features/imagelist/thumbnail'
import { useDatasetStore } from '@/store/datasetStore'
import { useUiStore } from '@/store/uiStore'

import { CanvasStage } from './CanvasStage'
import { CanvasContextMenu, type CanvasContextMenuState } from './CanvasContextMenu'
import { Filmstrip } from './Filmstrip'
import { annotationsForImage, categoryColor, categoryName, imageIndexOf } from './annotations'
import { useLoadedImage, useResolvedUrl } from './useLoadedImage'
import { fitViewport, zoomAt, type Viewport } from './viewport'

const LAYER_LABEL_KEYS = {
  bbox: 'viewer.layerBbox',
  polygon: 'viewer.layerPolygon',
  keypoint: 'viewer.layerKeypoint',
  mask: 'viewer.layerMask',
} as const

export interface ViewerProps {
  dataset: DatasetModel
  resolveImageUrl: (relPath: string) => Promise<string>
  resolveThumbnail: ThumbnailRenderer
}

export function Viewer({ dataset, resolveImageUrl, resolveThumbnail }: ViewerProps) {
  const { t } = useTranslation()
  const currentImageId = useDatasetStore((state) => state.currentImageId)
  const selectImage = useDatasetStore((state) => state.selectImage)
  const selectAnnotation = useDatasetStore((state) => state.selectAnnotation)
  const selectedIndex = useDatasetStore((state) => state.selectedAnnotationIndex)
  const addAnnotation = useDatasetStore((state) => state.addAnnotation)
  const updateAnnotation = useDatasetStore((state) => state.updateAnnotation)
  const deleteAnnotation = useDatasetStore((state) => state.deleteAnnotation)
  const duplicateAnnotation = useDatasetStore((state) => state.duplicateAnnotation)
  const layers = useUiStore((state) => state.layers)
  const toggleLayer = useUiStore((state) => state.toggleLayer)
  const tool = useUiStore((state) => state.tool)
  const activeCategoryId = useUiStore((state) => state.activeCategoryId)

  const imageIds = useMemo(() => dataset.images.map((image) => image.id), [dataset.images])
  const index = imageIndexOf(imageIds, currentImageId)
  const image = index >= 0 ? dataset.images[index] : undefined

  const categoryById = useMemo(
    () => new Map(dataset.categories.map((category) => [category.id, category])),
    [dataset.categories],
  )
  const colorOf = useCallback(
    (categoryId: number) => categoryColor(categoryById.get(categoryId)),
    [categoryById],
  )
  const nameOf = useCallback(
    (categoryId: number) => categoryName(categoryById.get(categoryId)),
    [categoryById],
  )
  const schemaOf = useCallback(
    (categoryId: number) => categoryById.get(categoryId)?.keypointSchema,
    [categoryById],
  )

  const annotations = useMemo(
    () => annotationsForImage(dataset.annotations, currentImageId),
    [dataset.annotations, currentImageId],
  )
  const imageLabels = useMemo(
    () =>
      annotations
        .filter((entry) => entry.annotation.type === 'classification')
        .map((entry) => nameOf(entry.annotation.categoryId))
        .filter((name) => name.length > 0),
    [annotations, nameOf],
  )

  const url = useResolvedUrl(resolveImageUrl, image?.filePath ?? null)
  const imageElement = useLoadedImage(url)
  const imageWidth = imageElement?.naturalWidth || image?.width || 0
  const imageHeight = imageElement?.naturalHeight || image?.height || 0

  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const [viewport, setViewport] = useState<Viewport | null>(null)
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(null)
  // Null while not editing: the field then shows the current image (index + 1).
  const [jumpDraft, setJumpDraft] = useState<string | null>(null)
  const onResize = useCallback((size: { width: number; height: number }) => setStageSize(size), [])

  const fitted = useMemo(
    () => fitViewport(imageWidth, imageHeight, stageSize.width, stageSize.height),
    [imageWidth, imageHeight, stageSize.width, stageSize.height],
  )
  const view = viewport ?? fitted

  const onZoom = useCallback(
    (pointer: { x: number; y: number }, factor: number) =>
      setViewport((previous) => zoomAt(previous ?? fitted, pointer, factor)),
    [fitted],
  )
  const onPan = useCallback(
    (x: number, y: number) => setViewport((previous) => ({ ...(previous ?? fitted), x, y })),
    [fitted],
  )
  const zoomByCenter = useCallback(
    (factor: number) =>
      setViewport((previous) =>
        zoomAt(previous ?? fitted, { x: stageSize.width / 2, y: stageSize.height / 2 }, factor),
      ),
    [fitted, stageSize.width, stageSize.height],
  )

  const imageCount = dataset.images.length
  const goTo = useCallback(
    (delta: number) => {
      if (imageCount === 0) {
        return
      }
      const next = Math.min(imageCount - 1, Math.max(0, index + delta))
      selectImage(dataset.images[next].id)
    },
    [dataset.images, imageCount, index, selectImage],
  )

  const fit = useCallback(() => setViewport(null), [])

  const commitJump = useCallback(
    (value: string) => {
      const n = Number.parseInt(value, 10)
      if (Number.isFinite(n) && imageCount > 0) {
        const target = Math.min(imageCount, Math.max(1, n))
        selectImage(dataset.images[target - 1].id)
      }
    },
    [imageCount, dataset.images, selectImage],
  )

  const onCreateBBox = useCallback(
    (bbox: BBox) => {
      if (currentImageId === null || activeCategoryId === null) {
        return
      }
      addAnnotation(
        clampAnnotation(
          { type: 'bbox', imageId: currentImageId, categoryId: activeCategoryId, bbox },
          imageWidth,
          imageHeight,
        ),
      )
    },
    [addAnnotation, currentImageId, activeCategoryId, imageWidth, imageHeight],
  )

  const onCreatePolygon = useCallback(
    (polygon: Polygon) => {
      if (currentImageId === null || activeCategoryId === null) {
        return
      }
      addAnnotation(
        clampAnnotation(
          {
            type: 'polygon',
            imageId: currentImageId,
            categoryId: activeCategoryId,
            polygons: [polygon],
            bbox: bboxFromPolygons([polygon]),
            area: polygonArea(polygon),
          },
          imageWidth,
          imageHeight,
        ),
      )
    },
    [addAnnotation, currentImageId, activeCategoryId, imageWidth, imageHeight],
  )

  const onCreateKeypoints = useCallback(
    (points: Point[]) => {
      if (currentImageId === null || activeCategoryId === null) {
        return
      }
      const names = schemaOf(activeCategoryId)?.names ?? []
      const keypoints = points.map((point, position) => ({
        x: point.x,
        y: point.y,
        v: 2 as const,
        ...(names[position] ? { name: names[position] } : {}),
      }))
      const bbox = bboxFromPoints(points)
      addAnnotation(
        clampAnnotation(
          {
            type: 'keypoints',
            imageId: currentImageId,
            categoryId: activeCategoryId,
            bbox,
            keypoints,
            numKeypoints: points.length,
            area: bboxArea(bbox),
          },
          imageWidth,
          imageHeight,
        ),
      )
    },
    [addAnnotation, currentImageId, activeCategoryId, schemaOf, imageWidth, imageHeight],
  )

  const onMoveAnnotation = useCallback(
    (targetIndex: number, dx: number, dy: number) =>
      updateAnnotation(
        targetIndex,
        (annotation) => {
          const moved = constrainTranslation(annotation, dx, dy, imageWidth, imageHeight)
          return translateAnnotation(annotation, moved.dx, moved.dy)
        },
        'move annotation',
      ),
    [updateAnnotation, imageWidth, imageHeight],
  )

  const onResizeAnnotation = useCallback(
    (targetIndex: number, edge: BoxEdge, point: Point) =>
      updateAnnotation(
        targetIndex,
        (annotation) =>
          annotation.type === 'bbox'
            ? {
                ...annotation,
                bbox: clampBBox(resizeBBox(annotation.bbox, edge, point), imageWidth, imageHeight),
              }
            : annotation,
        'resize annotation',
      ),
    [updateAnnotation, imageWidth, imageHeight],
  )

  const shortcuts = useMemo(
    () => ({
      zoomIn: () => zoomByCenter(1.25),
      zoomOut: () => zoomByCenter(1 / 1.25),
      fit,
      navigate: goTo,
      bounds: { width: imageWidth, height: imageHeight },
    }),
    [zoomByCenter, fit, goTo, imageWidth, imageHeight],
  )
  useEditorShortcuts(shortcuts)

  if (!image) {
    return (
      <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('viewer.noImage')}
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack sx={{ flex: 1, minHeight: 0 }}>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ px: 1, py: 0.5, alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}
      >
        <Tooltip title={t('viewer.prev')}>
          <span>
            <IconButton size="small" onClick={() => goTo(-1)} disabled={index <= 0}>
              <ChevronLeftIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('viewer.next')}>
          <span>
            <IconButton size="small" onClick={() => goTo(1)} disabled={index >= imageCount - 1}>
              <ChevronRightIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <TextField
            size="small"
            type="number"
            value={jumpDraft ?? String(index + 1)}
            onChange={(event) => setJumpDraft(event.target.value)}
            onFocus={() => setJumpDraft(String(index + 1))}
            onBlur={(event) => {
              commitJump(event.target.value)
              setJumpDraft(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                ;(event.target as HTMLInputElement).blur()
              }
            }}
            slotProps={{
              htmlInput: { min: 1, max: imageCount, 'aria-label': t('viewer.goto') },
            }}
            sx={{ width: 72 }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            / {imageCount}
          </Typography>
        </Stack>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Tooltip title={t('viewer.zoomOut')}>
          <IconButton size="small" onClick={() => zoomByCenter(1 / 1.25)}>
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" sx={{ minWidth: 48, textAlign: 'center' }}>
          {Math.round(view.scale * 100)}%
        </Typography>
        <Tooltip title={t('viewer.zoomIn')}>
          <IconButton size="small" onClick={() => zoomByCenter(1.25)}>
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('viewer.fit')}>
          <IconButton size="small" onClick={() => setViewport(null)}>
            <FitScreenIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        {(Object.keys(LAYER_LABEL_KEYS) as Array<keyof typeof LAYER_LABEL_KEYS>).map((layer) => (
          <FormControlLabel
            key={layer}
            control={
              <Switch size="small" checked={layers[layer]} onChange={() => toggleLayer(layer)} />
            }
            label={<Typography variant="caption">{t(LAYER_LABEL_KEYS[layer])}</Typography>}
          />
        ))}
        <Box sx={{ flex: 1 }} />
        {imageLabels.length > 0 ? (
          <Stack direction="row" spacing={0.5}>
            {imageLabels.map((label, labelIndex) => (
              <Chip key={`${label}-${labelIndex}`} size="small" label={label} />
            ))}
          </Stack>
        ) : null}
      </Stack>

      <AnnotateToolbar />

      <CanvasStage
        image={imageElement}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        viewport={view}
        annotations={annotations}
        layers={layers}
        tool={tool}
        activeCategoryId={activeCategoryId}
        colorOf={colorOf}
        nameOf={nameOf}
        schemaOf={schemaOf}
        selectedIndex={selectedIndex}
        onSelect={selectAnnotation}
        onMove={onMoveAnnotation}
        onResize={onResizeAnnotation}
        onCreateBBox={onCreateBBox}
        onCreatePolygon={onCreatePolygon}
        onCreateKeypoints={onCreateKeypoints}
        onZoom={onZoom}
        onPan={onPan}
        onResizeStage={onResize}
        onContextMenu={setContextMenu}
      />

      <CanvasContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(null)}
        onDelete={deleteAnnotation}
        onDuplicate={duplicateAnnotation}
        onFit={fit}
        onDeselect={() => selectAnnotation(null)}
      />

      <Filmstrip
        images={dataset.images}
        currentIndex={index}
        resolveThumbnail={resolveThumbnail}
        onSelect={(target) => selectImage(dataset.images[target].id)}
      />
    </Stack>
  )
}
