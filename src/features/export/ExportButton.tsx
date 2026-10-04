import { useMemo, useState } from 'react'

import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import type { ExportChoice, ExportFormat } from '@/core/formats/losses'
import { collectLosses, resolveExportFormat } from '@/core/formats/losses'
import { annotationCountByCategory, subsetByCategories } from '@/core/filter'
import type { Category } from '@/core/model'
import { getDatasetSource } from '@/platform'
import { useDatasetStore } from '@/store/datasetStore'
import { useSettingsStore } from '@/store/settingsStore'

import { exportDataset } from './exportDataset'

const CHOICES: ExportChoice[] = ['coco', 'yolo', 'voc', 'imagefolder']

/** Cap the options rendered in the dropdown so a huge class list stays snappy. */
const MAX_OPTION_ROWS = 200

function filterCategories(options: Category[], { inputValue }: { inputValue: string }): Category[] {
  const query = inputValue.trim().toLowerCase()
  const matches = query
    ? options.filter((category) => category.name.toLowerCase().includes(query))
    : options
  return matches.slice(0, MAX_OPTION_ROWS)
}

function defaultChoice(sourceFormat: string): ExportChoice {
  if (sourceFormat === 'yolo' || sourceFormat === 'yolo-seg' || sourceFormat === 'yolo-pose') {
    return 'yolo'
  }
  if (sourceFormat === 'voc' || sourceFormat === 'imagefolder') {
    return sourceFormat
  }
  return 'coco'
}

/** Copy text, falling back to a hidden textarea where the async API is missing. */
async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
}

interface ExportResult {
  count: number
  images: number
  format: ExportFormat
  path: string
}

export function ExportButton() {
  const { t } = useTranslation()
  const dataset = useDatasetStore((state) => state.dataset)
  const handle = useDatasetStore((state) => state.handle)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<ExportResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [choice, setChoice] = useState<ExportChoice>('coco')
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set())
  const [keepUnmatched, setKeepUnmatched] = useState(false)
  const [keepImages, setKeepImages] = useState(true)
  const [progress, setProgress] = useState(0)

  // A dataset with no classes has nothing to filter, so it is exported as-is.
  const filtered = useMemo(() => {
    if (!dataset) {
      return null
    }
    if (dataset.categories.length === 0) {
      return dataset
    }
    return subsetByCategories(dataset, {
      categoryIds: selected,
      keepUnmatchedImages: keepUnmatched,
    })
  }, [dataset, selected, keepUnmatched])

  const counts = useMemo(
    () => (dataset ? annotationCountByCategory(dataset) : new Map<number, number>()),
    [dataset],
  )

  const source = getDatasetSource()
  const format = useMemo(
    () => (filtered ? resolveExportFormat(filtered, choice) : null),
    [filtered, choice],
  )
  const target = useMemo(
    () => (handle && format ? source.exportTarget(handle, format) : null),
    [source, handle, format],
  )
  const losses = useMemo(
    () => (filtered && format ? collectLosses(filtered, format) : []),
    [filtered, format],
  )
  const selectedCategories = useMemo(
    () => (dataset ? dataset.categories.filter((category) => selected.has(category.id)) : []),
    [dataset, selected],
  )

  if (!dataset || !handle || !filtered || !format || !target) {
    return null
  }

  const hasClasses = dataset.categories.length > 0
  const noClassesSelected = hasClasses && selected.size === 0
  const canExport = !noClassesSelected && filtered.images.length > 0

  const openDialog = (): void => {
    const preferred = useSettingsStore.getState().defaultExportFormat
    setChoice(preferred ?? defaultChoice(dataset.sourceFormat))
    setSelected(new Set(dataset.categories.map((category) => category.id)))
    setKeepUnmatched(false)
    setError(null)
    setCopied(false)
    setProgress(0)
    setOpen(true)
  }

  const selectAll = (): void => {
    setSelected(new Set(dataset.categories.map((category) => category.id)))
  }

  const clearAll = (): void => {
    setSelected(new Set())
  }

  const run = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    setProgress(0)
    try {
      const result = await exportDataset(source, handle, filtered, format, {
        copyImages: keepImages,
        onProgress: setProgress,
      })
      setOpen(false)
      setCopied(false)
      setDone({
        count: result.files,
        images: result.images,
        format,
        path: target.displayPath,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Tooltip title={source.canWrite ? t('export.title') : t('export.readOnly')}>
        <span>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            disabled={!source.canWrite}
            onClick={openDialog}
          >
            {t('export.title')}
          </Button>
        </span>
      </Tooltip>

      <Dialog open={open} onClose={busy ? undefined : () => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('export.title')}</DialogTitle>
        <DialogContent>
          {busy ? (
            <Box sx={{ pb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {t('export.exporting')}
              </Typography>
              <LinearProgress variant="determinate" value={Math.round(progress * 100)} />
            </Box>
          ) : null}
          {/* A little top padding so the select's floating label is not clipped. */}
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              select
              size="small"
              label={t('export.format')}
              value={choice}
              onChange={(event) => setChoice(event.target.value as ExportChoice)}
            >
              {CHOICES.map((value) => (
                <MenuItem key={value} value={value}>
                  {t(`export.${value}`)}
                </MenuItem>
              ))}
            </TextField>

            {hasClasses ? (
              <>
                <Divider />

                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant="subtitle2">{t('export.classes')}</Typography>
                  <Box>
                    <Button size="small" onClick={selectAll}>
                      {t('export.selectAll')}
                    </Button>
                    <Button size="small" onClick={clearAll}>
                      {t('export.selectNone')}
                    </Button>
                  </Box>
                </Box>

                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  size="small"
                  limitTags={4}
                  options={dataset.categories}
                  value={selectedCategories}
                  getOptionLabel={(category) => category.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  filterOptions={filterCategories}
                  onChange={(_event, value) =>
                    setSelected(new Set(value.map((category) => category.id)))
                  }
                  renderOption={(props, option, state) => (
                    <li {...props} key={option.id}>
                      <Checkbox size="small" checked={state.selected} sx={{ mr: 1, py: 0 }} />
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          flexShrink: 0,
                          bgcolor: option.color ?? 'text.disabled',
                        }}
                      />
                      <Typography variant="body2" sx={{ flex: 1, mx: 1 }}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {counts.get(option.id) ?? 0}
                      </Typography>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('export.classes')}
                      placeholder={t('common.search')}
                    />
                  )}
                />

                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={keepUnmatched}
                      onChange={(event) => setKeepUnmatched(event.target.checked)}
                    />
                  }
                  label={<Typography variant="body2">{t('export.keepUnmatched')}</Typography>}
                />

                {dataset.categories.length > MAX_OPTION_ROWS ? (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('export.classesTruncated', {
                      shown: MAX_OPTION_ROWS,
                      total: dataset.categories.length,
                    })}
                  </Typography>
                ) : null}

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('export.selectedCount', {
                    selected: selected.size,
                    total: dataset.categories.length,
                  })}
                  {' · '}
                  {t('export.preview', {
                    images: filtered.images.length,
                    annotations: filtered.annotations.length,
                  })}
                </Typography>

                {noClassesSelected ? <Alert severity="info">{t('export.noClasses')}</Alert> : null}
                {!noClassesSelected && filtered.images.length === 0 ? (
                  <Alert severity="warning">{t('export.noImages')}</Alert>
                ) : null}
              </>
            ) : null}

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={keepImages}
                  onChange={(event) => setKeepImages(event.target.checked)}
                />
              }
              label={<Typography variant="body2">{t('export.copyImages')}</Typography>}
            />

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('export.hint', { path: target.displayPath })}
            </Typography>

            {losses.length > 0 ? (
              <Alert severity="warning">
                <Typography variant="subtitle2">{t('export.losses')}</Typography>
                <List dense disablePadding>
                  {losses.map((loss) => (
                    <ListItem key={loss} disableGutters sx={{ py: 0 }}>
                      <ListItemText
                        primary={<Typography variant="body2">{`• ${loss}`}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            ) : (
              <Alert severity="success">{t('export.noLosses')}</Alert>
            )}

            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" onClick={run} disabled={busy || !canExport}>
            {t('export.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={done !== null}
        autoHideDuration={8000}
        onClose={() => setDone(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={
          done ? (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2">
                {done.images > 0
                  ? t('export.doneWithImages', {
                      files: done.count,
                      images: done.images,
                      format: done.format,
                    })
                  : t('export.done', { count: done.count, format: done.format })}
              </Typography>
              <Typography
                variant="caption"
                sx={{ display: 'block', wordBreak: 'break-all', opacity: 0.85 }}
              >
                {done.path}
              </Typography>
            </Box>
          ) : undefined
        }
        action={
          done ? (
            <Tooltip title={copied ? t('common.copied') : t('common.copyPath')}>
              <IconButton
                size="small"
                color="inherit"
                aria-label={t('common.copyPath')}
                onClick={() => {
                  void copyText(done.path).then(() => setCopied(true))
                }}
              >
                {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          ) : null
        }
      />
    </>
  )
}
