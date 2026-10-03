import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CropFreeIcon from '@mui/icons-material/CropFree'
import DeleteIcon from '@mui/icons-material/Delete'
import HelpIcon from '@mui/icons-material/Help'
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'
import NearMeIcon from '@mui/icons-material/NearMe'
import PolylineIcon from '@mui/icons-material/Polyline'
import RedoIcon from '@mui/icons-material/Redo'
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot'
import UndoIcon from '@mui/icons-material/Undo'
import {
  Button,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import { useDatasetStore } from '@/store/datasetStore'
import { useUiStore, type EditorTool } from '@/store/uiStore'

const TOOLS: Array<{
  value: EditorTool
  icon: typeof NearMeIcon
  labelKey: string
  /** Keypoints only make sense for a class that defines a keypoint schema. */
  needsSchema?: boolean
}> = [
  { value: 'select', icon: NearMeIcon, labelKey: 'annotate.toolSelect' },
  { value: 'bbox', icon: CropFreeIcon, labelKey: 'annotate.toolBbox' },
  { value: 'polygon', icon: PolylineIcon, labelKey: 'annotate.toolPolygon' },
  {
    value: 'keypoint',
    icon: ScatterPlotIcon,
    labelKey: 'annotate.toolKeypoint',
    needsSchema: true,
  },
]

export function AnnotateToolbar() {
  const { t } = useTranslation()
  const dataset = useDatasetStore((state) => state.dataset)
  const currentImageId = useDatasetStore((state) => state.currentImageId)
  const selectedIndex = useDatasetStore((state) => state.selectedAnnotationIndex)
  const canUndo = useDatasetStore((state) => state.history.past.length > 0)
  const canRedo = useDatasetStore((state) => state.history.future.length > 0)
  const undo = useDatasetStore((state) => state.undo)
  const redo = useDatasetStore((state) => state.redo)
  const deleteAnnotation = useDatasetStore((state) => state.deleteAnnotation)
  const duplicateAnnotation = useDatasetStore((state) => state.duplicateAnnotation)
  const toggleClassification = useDatasetStore((state) => state.toggleClassification)

  const tool = useUiStore((state) => state.tool)
  const setTool = useUiStore((state) => state.setTool)
  const activeCategoryId = useUiStore((state) => state.activeCategoryId)
  const setActiveCategory = useUiStore((state) => state.setActiveCategory)
  const setCategoriesOpen = useUiStore((state) => state.setCategoriesOpen)
  const setHelpOpen = useUiStore((state) => state.setHelpOpen)

  if (!dataset) {
    return null
  }

  // Drawing needs a target class; default to the first one so a new box is never
  // silently dropped just because nothing was chosen yet.
  if (activeCategoryId === null && dataset.categories.length > 0) {
    setActiveCategory(dataset.categories[0].id)
  }

  const hasSelection = selectedIndex !== null
  const canLabel = activeCategoryId !== null && currentImageId !== null
  const activeSchema =
    activeCategoryId === null
      ? undefined
      : dataset.categories.find((category) => category.id === activeCategoryId)?.keypointSchema
  const hasLabel =
    activeCategoryId !== null &&
    currentImageId !== null &&
    dataset.annotations.some(
      (annotation) =>
        annotation.type === 'classification' &&
        annotation.imageId === currentImageId &&
        annotation.categoryId === activeCategoryId,
    )

  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ px: 1, py: 0.5, alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}
    >
      <ToggleButtonGroup
        size="small"
        exclusive
        value={tool}
        onChange={(_, value: EditorTool | null) => value && setTool(value)}
      >
        {TOOLS.map(({ value, icon: Icon, labelKey, needsSchema }) => {
          const disabled = Boolean(needsSchema) && !activeSchema
          const title = disabled ? t('annotate.keypointNeedsSchema') : t(labelKey)
          return (
            <ToggleButton key={value} value={value} disabled={disabled} aria-label={title}>
              <Tooltip title={title}>
                {/* Disabled buttons swallow pointer events; re-enable them for the tip. */}
                <span style={{ display: 'inline-flex', pointerEvents: 'auto' }}>
                  <Icon fontSize="small" />
                </span>
              </Tooltip>
            </ToggleButton>
          )
        })}
      </ToggleButtonGroup>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <TextField
        select
        size="small"
        label={t('annotate.category')}
        value={activeCategoryId === null ? '' : String(activeCategoryId)}
        onChange={(event) =>
          setActiveCategory(event.target.value === '' ? null : Number(event.target.value))
        }
        sx={{ minWidth: 160 }}
      >
        {dataset.categories.map((category) => (
          <MenuItem key={category.id} value={String(category.id)}>
            {category.name}
          </MenuItem>
        ))}
      </TextField>

      <Tooltip title={hasLabel ? t('annotate.unlabelHint') : t('annotate.labelHint')}>
        <span>
          <Button
            size="small"
            variant={hasLabel ? 'contained' : 'text'}
            startIcon={<LabelOutlinedIcon />}
            disabled={!canLabel}
            onClick={() => {
              if (currentImageId === null || activeCategoryId === null) return
              toggleClassification(currentImageId, activeCategoryId)
            }}
          >
            {hasLabel ? t('annotate.unlabel') : t('annotate.label')}
          </Button>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Tooltip title={t('annotate.duplicate')}>
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={() => selectedIndex !== null && duplicateAnnotation(selectedIndex)}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('annotate.delete')}>
        <span>
          <IconButton
            size="small"
            disabled={!hasSelection}
            onClick={() => selectedIndex !== null && deleteAnnotation(selectedIndex)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Tooltip title={t('annotate.undo')}>
        <span>
          <IconButton size="small" disabled={!canUndo} onClick={undo}>
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('annotate.redo')}>
        <span>
          <IconButton size="small" disabled={!canRedo} onClick={redo}>
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Tooltip title={t('categories.title')}>
        <IconButton size="small" onClick={() => setCategoriesOpen(true)}>
          <CategoryOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('shortcuts.title')}>
        <IconButton size="small" onClick={() => setHelpOpen(true)}>
          <HelpIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
