import { useState } from 'react'

import DownloadIcon from '@mui/icons-material/Download'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import type { ExportChoice } from '@/core/formats/losses'
import { collectLosses, resolveExportFormat } from '@/core/formats/losses'
import { getDatasetSource } from '@/platform'
import { useDatasetStore } from '@/store/datasetStore'
import { useSettingsStore } from '@/store/settingsStore'

import { exportDataset } from './exportDataset'

const CHOICES: ExportChoice[] = ['coco', 'yolo', 'voc', 'imagefolder']

function defaultChoice(sourceFormat: string): ExportChoice {
  if (sourceFormat === 'yolo' || sourceFormat === 'yolo-seg' || sourceFormat === 'yolo-pose') {
    return 'yolo'
  }
  if (sourceFormat === 'voc' || sourceFormat === 'imagefolder') {
    return sourceFormat
  }
  return 'coco'
}

export function ExportButton() {
  const { t } = useTranslation()
  const dataset = useDatasetStore((state) => state.dataset)
  const handle = useDatasetStore((state) => state.handle)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [choice, setChoice] = useState<ExportChoice>('coco')

  if (!dataset || !handle) {
    return null
  }

  const source = getDatasetSource()
  const format = resolveExportFormat(dataset, choice)
  const losses = collectLosses(dataset, format)

  const openDialog = (): void => {
    const preferred = useSettingsStore.getState().defaultExportFormat
    setChoice(preferred ?? defaultChoice(dataset.sourceFormat))
    setError(null)
    setOpen(true)
  }

  const run = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      const result = await exportDataset(source, handle, dataset, format)
      setOpen(false)
      setDone(t('export.done', { count: result.files, format }))
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
          <Stack spacing={2}>
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

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('export.hint', { path: `export/${format}/` })}
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
          <Button variant="contained" onClick={run} disabled={busy}>
            {t('export.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={done !== null}
        autoHideDuration={4000}
        onClose={() => setDone(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={done ?? ''}
      />
    </>
  )
}
