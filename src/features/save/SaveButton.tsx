import { useState } from 'react'

import KeyIcon from '@mui/icons-material/Key'
import SaveIcon from '@mui/icons-material/Save'
import { Badge, Button, CircularProgress, Snackbar, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { getDatasetSource } from '@/platform'
import { useDatasetStore } from '@/store/datasetStore'
import { useSaveStore } from '@/store/saveStore'
import { useWriteAccessStore } from '@/store/writeAccessStore'

import { saveCurrentDataset } from './saveDataset'

/** Toolbar button that writes the open dataset back to its source files. */
export function SaveButton() {
  const { t } = useTranslation()
  const dataset = useDatasetStore((state) => state.dataset)
  const handle = useDatasetStore((state) => state.handle)
  const dirty = useDatasetStore((state) => state.dirty)
  const saving = useSaveStore((state) => state.saving)
  const permission = useWriteAccessStore((state) => state.permission)
  const requesting = useWriteAccessStore((state) => state.requesting)
  const requestWrite = useWriteAccessStore((state) => state.request)
  const [message, setMessage] = useState<string | null>(null)

  if (!dataset) {
    return null
  }

  const canWrite = getDatasetSource().canWrite
  // A browser can open a folder read-only; when that is reversible, offer to ask
  // for write access instead of leaving the button dead.
  const needsGrant = canWrite && (permission === 'prompt' || permission === 'denied')
  const writable = canWrite && permission === 'granted'

  const run = async (): Promise<void> => {
    const result = await saveCurrentDataset()
    if (result.status === 'saved') {
      setMessage(t('save.saved'))
    } else if (result.status === 'unsupported') {
      setMessage(t('save.unsupported'))
    } else if (result.status === 'readOnly') {
      setMessage(t('save.readOnly'))
    } else if (result.status === 'error') {
      setMessage(result.message)
      // A denied write means the handle is read-only after all; re-check so the
      // grant affordance appears.
      void useWriteAccessStore.getState().refresh(useDatasetStore.getState().handle)
    }
  }

  const grantAndSave = async (): Promise<void> => {
    if (!handle) {
      return
    }
    if (!(await requestWrite(handle))) {
      setMessage(t('save.grantDenied'))
      return
    }
    if (useDatasetStore.getState().dirty) {
      await run()
    }
  }

  const snackbar = (
    <Snackbar
      open={message !== null}
      autoHideDuration={6000}
      onClose={() => setMessage(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      message={message ?? ''}
    />
  )

  if (needsGrant) {
    return (
      <>
        <Tooltip title={t('save.grantWriteHint')}>
          <span>
            <Button
              size="small"
              color="warning"
              startIcon={requesting ? <CircularProgress size={16} color="inherit" /> : <KeyIcon />}
              disabled={requesting || !handle}
              onClick={() => void grantAndSave()}
            >
              {requesting ? t('save.grantingWrite') : t('save.grantWrite')}
            </Button>
          </span>
        </Tooltip>
        {snackbar}
      </>
    )
  }

  return (
    <>
      <Tooltip title={writable ? t('common.save') : t('save.readOnly')}>
        <span>
          <Badge color="warning" variant="dot" invisible={!dirty} overlap="circular">
            <Button
              size="small"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              disabled={!writable || !dirty || saving}
              onClick={() => void run()}
            >
              {saving ? t('save.saving') : t('common.save')}
            </Button>
          </Badge>
        </span>
      </Tooltip>
      {snackbar}
    </>
  )
}
