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
  InputAdornment,
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
import type { SplitRatios } from '@/core/split'
import { DEFAULT_SPLIT_RATIOS, hasAnyRatio, partitionDataset } from '@/core/split'
import { getDatasetSource } from '@/platform'
import { useDatasetStore } from '@/store/datasetStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useWriteAccessStore } from '@/store/writeAccessStore'

import { exportDataset, type SplitLayout } from './exportDataset'
import { createExportStamp } from './exportStamp'
import { supportsLabelsFirst } from './labelsFirst'

const CHOICES: ExportChoice[] = ['coco', 'yolo', 'mindyolo', 'voc', 'imagefolder', 'labelme', 'csv']

/** Split ratios are edited as whole percentages. */
interface SplitPercent {
  train: number
  val: number
  test: number
}

const DEFAULT_SPLIT_PERCENT: SplitPercent = {
  train: Math.round(DEFAULT_SPLIT_RATIOS.train * 100),
  val: Math.round(DEFAULT_SPLIT_RATIOS.val * 100),
  test: Math.round(DEFAULT_SPLIT_RATIOS.test * 100),
}

function percentToRatios(percent: SplitPercent): SplitRatios {
  return { train: percent.train / 100, val: percent.val / 100, test: percent.test / 100 }
}

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
  if (sourceFormat === 'mindyolo' || sourceFormat === 'labelme' || sourceFormat === 'csv') {
    return sourceFormat
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
  /** Per-split image counts, present only for a split export. */
  splits?: { split: string; images: number }[]
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
  const [split, setSplit] = useState(false)
  const [percent, setPercent] = useState<SplitPercent>(DEFAULT_SPLIT_PERCENT)
  const [seed, setSeed] = useState('0')
  const [layout, setLayout] = useState<SplitLayout>('split-first')
  // Decided when the dialog opens so the previewed path and the written path agree.
  const [stamp, setStamp] = useState('')
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
    () => (handle && format ? source.exportTarget(handle, format, stamp) : null),
    [source, handle, format, stamp],
  )
  const losses = useMemo(
    () => (filtered && format ? collectLosses(filtered, format) : []),
    [filtered, format],
  )
  const splitPreview = useMemo(() => {
    if (!filtered || !split) {
      return null
    }
    const ratios = percentToRatios(percent)
    if (!hasAnyRatio(ratios)) {
      return null
    }
    const parsedSeed = Number.parseInt(seed, 10)
    return partitionDataset(filtered, ratios, Number.isFinite(parsedSeed) ? parsedSeed : 0).map(
      (partition) => ({ split: partition.split, images: partition.dataset.images.length }),
    )
  }, [filtered, split, percent, seed])
  const selectedCategories = useMemo(
    () => (dataset ? dataset.categories.filter((category) => selected.has(category.id)) : []),
    [dataset, selected],
  )
  const permission = useWriteAccessStore((state) => state.permission)
  const writable = source.canWrite && permission === 'granted'

  if (!dataset || !handle || !filtered || !format || !target) {
    return null
  }

  const hasClasses = dataset.categories.length > 0
  const noClassesSelected = hasClasses && selected.size === 0
  const splitValid = !split || hasAnyRatio(percentToRatios(percent))
  const canExport = !noClassesSelected && filtered.images.length > 0 && splitValid

  const openDialog = (): void => {
    const preferred = useSettingsStore.getState().defaultExportFormat
    setChoice(preferred ?? defaultChoice(dataset.sourceFormat))
    setSelected(new Set(dataset.categories.map((category) => category.id)))
    setKeepUnmatched(false)
    setSplit(false)
    setPercent(DEFAULT_SPLIT_PERCENT)
    setSeed('0')
    setLayout('split-first')
    setStamp(createExportStamp())
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
    const parsedSeed = Number.parseInt(seed, 10)
    try {
      const result = await exportDataset(source, handle, filtered, format, {
        copyImages: keepImages,
        stamp,
        ...(split
          ? {
              split: percentToRatios(percent),
              seed: Number.isFinite(parsedSeed) ? parsedSeed : 0,
              layout,
            }
          : {}),
        onProgress: setProgress,
      })
      setOpen(false)
      setCopied(false)
      setDone({
        count: result.files,
        images: result.images,
        format,
        path: target.displayPath,
        ...(result.splits
          ? { splits: result.splits.map((entry) => ({ split: entry.split, images: entry.images })) }
          : {}),
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Tooltip title={writable ? t('export.title') : t('export.readOnly')}>
        <span>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            disabled={!writable}
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

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={split}
                  onChange={(event) => setSplit(event.target.checked)}
                />
              }
              label={<Typography variant="body2">{t('export.split')}</Typography>}
            />

            {split ? (
              <>
                <Stack direction="row" spacing={1}>
                  {(['train', 'val', 'test'] as const).map((key) => (
                    <TextField
                      key={key}
                      size="small"
                      type="number"
                      label={t(`export.${key}`)}
                      value={percent[key]}
                      onChange={(event) =>
                        setPercent((current) => ({
                          ...current,
                          [key]: Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                        }))
                      }
                      slotProps={{
                        input: {
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        },
                      }}
                    />
                  ))}
                </Stack>

                <TextField
                  size="small"
                  type="number"
                  label={t('export.seed')}
                  value={seed}
                  onChange={(event) => setSeed(event.target.value)}
                />

                {format && supportsLabelsFirst(format) ? (
                  <TextField
                    select
                    size="small"
                    label={t('export.layout')}
                    value={layout}
                    onChange={(event) => setLayout(event.target.value as SplitLayout)}
                  >
                    <MenuItem value="split-first">{t('export.layoutSplitFirst')}</MenuItem>
                    <MenuItem value="labels-first">{t('export.layoutLabelsFirst')}</MenuItem>
                  </TextField>
                ) : null}

                {splitPreview ? (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('export.splitPreview', {
                      summary: splitPreview
                        .map((entry) => `${t(`export.${entry.split}`)} ${entry.images}`)
                        .join(' · '),
                    })}
                  </Typography>
                ) : (
                  <Alert severity="warning">{t('export.splitInvalid')}</Alert>
                )}

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('export.splitHint', { path: target.displayPath })}
                </Typography>
              </>
            ) : null}

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
              {done.splits ? (
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
                  {done.splits
                    .map((entry) => `${t(`export.${entry.split}`)} ${entry.images}`)
                    .join(' · ')}
                </Typography>
              ) : null}
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
