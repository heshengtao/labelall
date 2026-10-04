import { useState } from 'react'

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import { useSaveStore } from '@/store/saveStore'

import { saveCurrentDataset } from './saveDataset'

/**
 * Shown before an action that would discard unsaved edits. "Save" runs the same
 * save flow as the toolbar button; a failed or declined save keeps the prompt
 * open so the edits are never lost silently.
 */
export function UnsavedChangesDialog() {
  const { t } = useTranslation()
  const open = useSaveStore((state) => state.unsavedOpen)
  const saving = useSaveStore((state) => state.saving)
  const answer = useSaveStore((state) => state.answerUnsaved)
  const [error, setError] = useState<string | null>(null)

  const dismiss = (): void => {
    setError(null)
    answer(false)
  }

  const onSave = async (): Promise<void> => {
    setError(null)
    const result = await saveCurrentDataset()
    if (result.status === 'saved') {
      answer(true)
      return
    }
    if (result.status === 'cancelled') {
      return
    }
    if (result.status === 'error') {
      setError(result.message)
      return
    }
    setError(t('save.unsupported'))
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : dismiss} maxWidth="xs" fullWidth>
      <DialogTitle>{t('save.unsavedTitle')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('save.unsavedBody')}</DialogContentText>
        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={dismiss} disabled={saving}>
          {t('common.cancel')}
        </Button>
        <Button
          color="error"
          onClick={() => {
            setError(null)
            answer(true)
          }}
          disabled={saving}
        >
          {t('save.discard')}
        </Button>
        <Button variant="contained" onClick={() => void onSave()} disabled={saving}>
          {t('save.saveAndContinue')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/**
 * Confirms a save that cannot represent the whole dataset. Saving overwrites the
 * originals, so anything the writer would drop is shown before it happens.
 */
export function SaveConfirmDialog() {
  const { t } = useTranslation()
  const open = useSaveStore((state) => state.lossyOpen)
  const warnings = useSaveStore((state) => state.lossyWarnings)
  const answer = useSaveStore((state) => state.answerLossy)

  return (
    <Dialog open={open} onClose={() => answer(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{t('save.overwriteTitle')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('save.overwriteBody')}</DialogContentText>
        <List dense disablePadding sx={{ mt: 1 }}>
          {warnings.map((warning) => (
            <ListItem key={warning} disableGutters sx={{ py: 0 }}>
              <ListItemText primary={<Typography variant="body2">{`• ${warning}`}</Typography>} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => answer(false)}>{t('common.cancel')}</Button>
        <Button color="warning" variant="contained" onClick={() => answer(true)}>
          {t('save.confirmOverwrite')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
