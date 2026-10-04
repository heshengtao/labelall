import { useCallback, useEffect, useRef, useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import GitHubIcon from '@mui/icons-material/GitHub'
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
import { WindowControls } from '@/components/WindowControls'
import type { DetectionCandidate } from '@/core/formats/detect'
import { IMAGE_EXTENSIONS } from '@/core/formats/detect'
import type { DatasetModel } from '@/core/model'
import { fileExtension } from '@/core/path'
import { CategoriesPanel } from '@/features/categories/CategoriesPanel'
import { CategoryLegend } from '@/features/categories/CategoryLegend'
import { ExportButton } from '@/features/export/ExportButton'
import { ShortcutsDialog } from '@/features/help/ShortcutsDialog'
import { SaveButton } from '@/features/save/SaveButton'
import { SaveConfirmDialog, UnsavedChangesDialog } from '@/features/save/SaveDialogs'
import { guardUnsavedChanges, useCloseGuard, useSaveShortcut } from '@/features/save/useSaveGuards'
import { ImageList } from '@/features/imagelist/ImageList'
import { clearThumbnailCache } from '@/features/imagelist/thumbnail'
import { ImportReportDialog } from '@/features/open/ImportReportDialog'
import { OpenDialog } from '@/features/open/OpenDialog'
import { beginOpen, cancelOpen, confirmOpen, openHandle } from '@/features/open/openDatasetFlow'
import { SettingsDialog } from '@/features/settings/SettingsDialog'
import { UpdateDialog } from '@/features/update/UpdateDialog'
import { Viewer } from '@/features/viewer/Viewer'
import { ConsentBanner } from '@/legal/ConsentBanner'
import { LegalPage } from '@/legal/LegalPage'
import { useLegalHash } from '@/legal/useLegalHash'
import { getDatasetSource } from '@/platform'
import { detectRuntimeEnv } from '@/platform/detect-env'
import { isDemoSite } from '@/platform/demoSite'
import { GITHUB_URL, openExternal } from '@/platform/openExternal'
import {
  handleTopBarPointerDown,
  hasCustomWindowControls,
  isMacDesktop,
} from '@/platform/windowChrome'
import { useDatasetStore } from '@/store/datasetStore'
import { useLegalStore } from '@/store/legalStore'
import { useSettingsStore, type RecentDataset } from '@/store/settingsStore'
import { useUiStore } from '@/store/uiStore'
import { useWriteAccessStore } from '@/store/writeAccessStore'
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
        <SaveButton />
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
      <CategoryLegend categories={dataset.categories} annotations={dataset.annotations} />
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
  const macDesktop = isMacDesktop()
  const showWindowControls = hasCustomWindowControls()
  const desktopChrome = macDesktop || showWindowControls
  const parseServiceRef = useRef<ParseService | null>(null)
  const [busy, setBusy] = useState(false)

  const status = useDatasetStore((state) => state.status)
  const progress = useDatasetStore((state) => state.progress)
  const handle = useDatasetStore((state) => state.handle)
  const dataset = useDatasetStore((state) => state.dataset)
  const warnings = useDatasetStore((state) => state.warnings)
  const pending = useDatasetStore((state) => state.pending)
  const currentImageId = useDatasetStore((state) => state.currentImageId)
  const selectImage = useDatasetStore((state) => state.selectImage)
  const close = useDatasetStore((state) => state.close)
  const viewMode = useUiStore((state) => state.viewMode)
  const setSettingsOpen = useUiStore((state) => state.setSettingsOpen)
  const recent = useSettingsStore((state) => state.recent)
  const rememberDataset = useSettingsStore((state) => state.rememberDataset)
  const forgetDataset = useSettingsStore((state) => state.forgetDataset)
  const rememberPosition = useSettingsStore((state) => state.rememberPosition)
  const legalRoute = useLegalStore((state) => state.route)
  const demoSite = isDemoSite()
  useLegalHash()
  useSaveShortcut()
  useCloseGuard()

  // Thumbnails are keyed by dataset-relative path, so drop the cache whenever a
  // different dataset is opened.
  useEffect(() => {
    if (handle?.id) {
      clearThumbnailCache()
    }
  }, [handle?.id])

  // Write permission is per opened folder — a browser can hand back a read-only
  // handle — so re-check it whenever the dataset changes.
  useEffect(() => {
    void useWriteAccessStore.getState().refresh(handle)
  }, [handle])

  // Remember the last image viewed in each dataset, so reopening returns there.
  useEffect(() => {
    if (handle && currentImageId !== null) {
      rememberPosition(handle.id, currentImageId)
    }
  }, [handle, currentImageId, rememberPosition])

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
    if (!(await guardUnsavedChanges())) {
      return
    }
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
        // Return to the image the user last had open in this dataset, if any.
        const saved = useSettingsStore.getState().positions[state.handle.id]
        if (saved != null && state.dataset.images.some((image) => image.id === saved)) {
          state.selectImage(saved)
        }
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
    if (!(await guardUnsavedChanges())) {
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

  const handleCloseDataset = async (): Promise<void> => {
    if (await guardUnsavedChanges()) {
      close()
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

  const resolveThumbnail = useCallback(
    (relPath: string, maxEdge: number) => {
      if (!handle) {
        return Promise.reject(new Error('no dataset is open'))
      }
      return getDatasetSource().thumbnail(handle, relPath, maxEdge)
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
        onMouseDown={handleTopBarPointerDown}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          userSelect: desktopChrome ? 'none' : undefined,
        }}
      >
        {/* Padding is applied inline so the macOS traffic-light gap stays on the
            physical left even when the layout is mirrored for RTL languages. */}
        <Toolbar
          variant="dense"
          style={macDesktop ? { paddingLeft: 80 } : undefined}
          sx={{ gap: 1 }}
        >
          <DatasetOutlinedIcon color="primary" />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, mr: 1 }}>
            {t('app.name')}
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
          <Tooltip title="GitHub">
            <IconButton aria-label="GitHub" onClick={() => void openExternal(GITHUB_URL)}>
              <GitHubIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('settings.title')}>
            <IconButton aria-label={t('settings.title')} onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <ThemeModeToggle />
          <LanguageToggle />
          {dataset ? (
            <Tooltip title={t('dataset.close')}>
              <IconButton aria-label={t('dataset.close')} onClick={() => void handleCloseDataset()}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          {showWindowControls ? <WindowControls /> : null}
        </Toolbar>
        {working ? (
          <LinearProgress variant="determinate" value={Math.round(progress * 100)} />
        ) : null}
      </AppBar>

      <Box
        component="main"
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}
      >
        {demoSite && legalRoute ? (
          <LegalPage />
        ) : dataset && handle ? (
          <Stack sx={{ flex: 1, minHeight: 0 }}>
            <DatasetHeader name={handle.displayName} dataset={dataset} warnings={warnings} />
            {viewMode === 'viewer' ? (
              <Viewer
                dataset={dataset}
                resolveImageUrl={resolveImageUrl}
                resolveThumbnail={resolveThumbnail}
              />
            ) : (
              <ImageList
                dataset={dataset}
                selectedId={currentImageId}
                onSelect={selectImage}
                resolveThumbnail={resolveThumbnail}
              />
            )}
          </Stack>
        ) : (
          <Stack sx={{ flex: 1 }}>
            <WelcomeView
              onOpenDataset={handleOpen}
              recent={recent}
              onOpenRecent={handleOpenRecent}
              onDeleteRecent={(entry) => forgetDataset(entry.id)}
              canReopen={runtimeEnv === 'tauri'}
            />
          </Stack>
        )}
      </Box>

      {demoSite ? <ConsentBanner /> : null}

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
      <ImportReportDialog />
      <UpdateDialog />
      <UnsavedChangesDialog />
      <SaveConfirmDialog />
    </>
  )
}
