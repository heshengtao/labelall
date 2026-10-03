import { useCallback, useRef, useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import SettingsIcon from '@mui/icons-material/Settings'
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  CssBaseline,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import { LanguageToggle } from '@/components/LanguageToggle'
import { ThemeModeToggle } from '@/components/ThemeModeToggle'
import { WelcomeView } from '@/components/WelcomeView'
import type { DetectionCandidate } from '@/core/formats/detect'
import { IMAGE_EXTENSIONS } from '@/core/formats/detect'
import type { DatasetModel } from '@/core/model'
import { fileExtension } from '@/core/path'
import { CategoriesPanel } from '@/features/categories/CategoriesPanel'
import { ExportButton } from '@/features/export/ExportButton'
import { ShortcutsDialog } from '@/features/help/ShortcutsDialog'
import { ImageList } from '@/features/imagelist/ImageList'
import { OpenDialog } from '@/features/open/OpenDialog'
import { beginOpen, cancelOpen, confirmOpen, openHandle } from '@/features/open/openDatasetFlow'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { Viewer } from '@/features/viewer/Viewer'
import { getDatasetSource } from '@/platform'
import { detectRuntimeEnv } from '@/platform/detect-env'
import { useDatasetStore } from '@/store/datasetStore'
import { useSettingsStore, type RecentDataset } from '@/store/settingsStore'
import { useUiStore } from '@/store/uiStore'
import type { ParseService } from '@/workers/parseClient'

interface DatasetHeaderProps {
  name: string
  dataset: DatasetModel
  warnings: string[]
}

function DatasetHeader({ name, dataset, warnings }: DatasetHeaderProps) {
  const { t } = useTranslation()
  const viewMode = useUiStore((state) => state.viewMode)
  const setViewMode = useUiStore((state) => state.setViewMode)

  return (
    <Stack spacing={1} sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('dataset.stats', {
            images: dataset.images.length,
            categories: dataset.categories.length,
            annotations: dataset.annotations.length,
          })}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <ExportButton />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={viewMode}
          onChange={(_, value) => value && setViewMode(value)}
        >
          <ToggleButton value="grid" aria-label={t('viewer.grid')}>
            <Tooltip title={t('viewer.grid')}>
              <GridViewOutlinedIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="viewer" aria-label={t('viewer.canvas')}>
            <Tooltip title={t('viewer.canvas')}>
              <ImageOutlinedIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {warnings.length > 0 ? (
        <Alert severity="warning">
          {t('dataset.warnings', { count: warnings.length })} — {warnings.slice(0, 3).join('; ')}
        </Alert>
      ) : null}
    </Stack>
  )
}

export default function App() {
  const { t } = useTranslation()
  const runtimeEnv = detectRuntimeEnv()
  const parseServiceRef = useRef<ParseService | null>(null)
  const [busy, setBusy] = useState(false)

  const status = useDatasetStore((state) => state.status)
  const progress = useDatasetStore((state) => state.progress)
  const error = useDatasetStore((state) => state.error)
  const handle = useDatasetStore((state) => state.handle)
  const dataset = useDatasetStore((state) => state.dataset)
  const warnings = useDatasetStore((state) => state.warnings)
  const pending = useDatasetStore((state) => state.pending)
  const currentImageId = useDatasetStore((state) => state.currentImageId)
  const selectImage = useDatasetStore((state) => state.selectImage)
  const setError = useDatasetStore((state) => state.setError)
  const setStatus = useDatasetStore((state) => state.setStatus)
  const close = useDatasetStore((state) => state.close)
  const viewMode = useUiStore((state) => state.viewMode)
  const setSettingsOpen = useUiStore((state) => state.setSettingsOpen)
  const recent = useSettingsStore((state) => state.recent)
  const rememberDataset = useSettingsStore((state) => state.rememberDataset)

  // The worker (and the parse service) are created on first use so the module
  // is never loaded — and no worker is spawned — until the user opens a dataset.
  const getParseService = async (): Promise<ParseService> => {
    if (!parseServiceRef.current) {
      const { createWorkerParseService } = await import('@/workers/parseClient')
      parseServiceRef.current = createWorkerParseService(getDatasetSource())
    }
    return parseServiceRef.current
  }

  const handleOpen = async (): Promise<void> => {
    setBusy(true)
    try {
      const service = await getParseService()
      await beginOpen(getDatasetSource(), service)
    } finally {
      setBusy(false)
    }
  }

  const handleConfirm = async (candidate: DetectionCandidate): Promise<void> => {
    setBusy(true)
    try {
      const service = await getParseService()
      await confirmOpen(service, candidate)
      const state = useDatasetStore.getState()
      if (state.dataset && state.handle) {
        rememberDataset({
          id: state.handle.id,
          root: state.handle.root,
          displayName: state.handle.displayName,
          kind: getDatasetSource().kind,
        })
      }
    } finally {
      setBusy(false)
    }
  }

  const handleOpenRecent = async (entry: RecentDataset): Promise<void> => {
    // Web handles cannot be restored across sessions, so only the desktop build
    // can reopen a recent dataset directly.
    if (entry.kind !== 'tauri') {
      return
    }
    setBusy(true)
    try {
      const service = await getParseService()
      await openHandle(getDatasetSource(), service, {
        id: entry.root,
        root: entry.root,
        displayName: entry.displayName,
      })
    } finally {
      setBusy(false)
    }
  }

  const resolveImageUrl = useCallback(
    (relPath: string) => {
      if (!handle) {
        return Promise.reject(new Error('no dataset is open'))
      }
      return getDatasetSource().getImageUrl(handle, relPath)
    },
    [handle],
  )

  const working = status === 'scanning' || status === 'detecting' || status === 'parsing'
  const imageCount = pending
    ? pending.files.filter(
        (entry) => !entry.isDir && IMAGE_EXTENSIONS.has(fileExtension(entry.path)),
      ).length
    : 0

  return (
    <>
      <CssBaseline />
      <AppBar
        position="static"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <DatasetOutlinedIcon color="primary" />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, mr: 1 }}>
            {t('app.name')}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', display: { xs: 'none', md: 'block' } }}
          >
            {dataset && handle ? handle.displayName : t('app.tagline')}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Tooltip title={t('env.desktop') + ' / ' + t('env.web')}>
            <Chip
              size="small"
              variant="outlined"
              label={runtimeEnv === 'tauri' ? t('env.desktop') : t('env.web')}
              sx={{ mr: 1 }}
            />
          </Tooltip>
          {working ? (
            <Button size="small" color="inherit" onClick={cancelOpen}>
              {t('common.cancel')}
            </Button>
          ) : null}
          {dataset ? (
            <Button size="small" startIcon={<FolderOpenOutlinedIcon />} onClick={handleOpen}>
              {t('actions.openDataset')}
            </Button>
          ) : null}
          <Tooltip title={t('settings.title')}>
            <IconButton aria-label={t('settings.title')} onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <ThemeModeToggle />
          <LanguageToggle />
          {dataset ? (
            <Tooltip title={t('dataset.close')}>
              <IconButton aria-label={t('dataset.close')} onClick={close}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          ) : null}
        </Toolbar>
        {working ? (
          <LinearProgress variant="determinate" value={Math.round(progress * 100)} />
        ) : null}
      </AppBar>

      <Box
        component="main"
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}
      >
        {dataset && handle ? (
          <Stack sx={{ flex: 1, minHeight: 0 }}>
            <DatasetHeader name={handle.displayName} dataset={dataset} warnings={warnings} />
            {viewMode === 'viewer' ? (
              <Viewer dataset={dataset} resolveImageUrl={resolveImageUrl} />
            ) : (
              <ImageList
                dataset={dataset}
                selectedId={currentImageId}
                onSelect={selectImage}
                resolveImageUrl={resolveImageUrl}
              />
            )}
          </Stack>
        ) : (
          <Stack sx={{ flex: 1 }}>
            <WelcomeView
              onOpenDataset={handleOpen}
              recent={recent}
              onOpenRecent={handleOpenRecent}
              canReopen={runtimeEnv === 'tauri'}
            />
          </Stack>
        )}
      </Box>

      <OpenDialog
        open={pending !== null}
        candidates={pending?.candidates ?? []}
        imageCount={imageCount}
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={cancelOpen}
      />

      <CategoriesPanel />
      <ShortcutsDialog />
      <SettingsDialog />

      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => {
          setError(null)
          setStatus('idle')
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          onClose={() => {
            setError(null)
            setStatus('idle')
          }}
        >
          {error ?? ''}
        </Alert>
      </Snackbar>
    </>
  )
}
