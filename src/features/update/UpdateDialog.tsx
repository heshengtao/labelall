import { useEffect } from 'react'

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import { useUpdateStore } from '@/store/updateStore'

const OPEN_STATUSES = new Set(['available', 'downloading', 'ready', 'current', 'error'])

export function UpdateDialog() {
  const { t } = useTranslation()
  const status = useUpdateStore((state) => state.status)
  const version = useUpdateStore((state) => state.version)
  const notes = useUpdateStore((state) => state.notes)
  const progress = useUpdateStore((state) => state.progress)
  const error = useUpdateStore((state) => state.error)
  const checkForUpdates = useUpdateStore((state) => state.checkForUpdates)
  const installUpdate = useUpdateStore((state) => state.installUpdate)
  const dismiss = useUpdateStore((state) => state.dismiss)

  // Check once shortly after launch; stay quiet unless there is an update.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkForUpdates({ silent: true })
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [checkForUpdates])

  const open = OPEN_STATUSES.has(status)
  const busy = status === 'downloading' || status === 'ready'

  const title =
    status === 'available'
      ? t('update.available', { version: version ?? '' })
      : status === 'current'
        ? t('update.current')
        : status === 'error'
          ? t('update.error')
          : t('update.title')

  return (
    <Dialog open={open} onClose={busy ? undefined : dismiss} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {status === 'downloading' || status === 'ready' ? (
            <>
              <Typography variant="body2">{t('update.downloading')}</Typography>
              <LinearProgress
                variant={status === 'ready' ? 'determinate' : 'determinate'}
                value={Math.round(progress * 100)}
              />
            </>
          ) : null}

          {status === 'available' && notes ? (
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                color: 'text.secondary',
                maxHeight: 240,
                overflowY: 'auto',
              }}
            >
              {notes}
            </Typography>
          ) : null}

          {status === 'error' ? (
            <Alert severity="error">
              {error === 'desktop-only' ? t('update.desktopOnly') : (error ?? t('update.error'))}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        {status === 'available' ? (
          <>
            <Button onClick={dismiss}>{t('update.later')}</Button>
            <Button variant="contained" onClick={() => void installUpdate()}>
              {t('update.install')}
            </Button>
          </>
        ) : (
          <Button variant="contained" onClick={dismiss} disabled={busy}>
            {t('common.close')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
