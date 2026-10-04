import { useEffect, useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import CropSquareOutlinedIcon from '@mui/icons-material/CropSquareOutlined'
import FilterNoneOutlinedIcon from '@mui/icons-material/FilterNoneOutlined'
import RemoveIcon from '@mui/icons-material/Remove'
import { IconButton, Stack, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'

import {
  closeWindow,
  isWindowMaximized,
  minimizeWindow,
  onWindowResized,
  toggleMaximizeWindow,
} from '@/platform/windowChrome'

/** Minimise / maximise / close controls the app draws itself on Windows and Linux. */
export function WindowControls() {
  const { t } = useTranslation()
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    let disposed = false
    let unlisten: (() => void) | undefined

    const sync = (): void => {
      void isWindowMaximized().then((value) => {
        if (!disposed) {
          setMaximized(value)
        }
      })
    }

    sync()
    void onWindowResized(sync).then((stop) => {
      unlisten = stop
    })

    return () => {
      disposed = true
      unlisten?.()
    }
  }, [])

  return (
    <Stack direction="row" sx={{ alignItems: 'center' }}>
      <Tooltip title={t('window.minimize')}>
        <IconButton size="small" aria-label={t('window.minimize')} onClick={minimizeWindow}>
          <RemoveIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={maximized ? t('window.restore') : t('window.maximize')}>
        <IconButton
          size="small"
          aria-label={maximized ? t('window.restore') : t('window.maximize')}
          onClick={toggleMaximizeWindow}
        >
          {maximized ? (
            <FilterNoneOutlinedIcon fontSize="small" />
          ) : (
            <CropSquareOutlinedIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
      <Tooltip title={t('window.close')}>
        <IconButton size="small" aria-label={t('window.close')} onClick={closeWindow}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
