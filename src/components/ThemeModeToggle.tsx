import { useState } from 'react'

import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto'
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  useColorScheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

type Mode = 'light' | 'dark' | 'system'

const MODE_ICON: Record<Mode, typeof Brightness7Icon> = {
  light: Brightness7Icon,
  dark: Brightness4Icon,
  system: BrightnessAutoIcon,
}

const MODES: Mode[] = ['light', 'dark', 'system']

export function ThemeModeToggle() {
  const { t } = useTranslation()
  const colorScheme = useColorScheme()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const mode: Mode = (colorScheme?.mode as Mode | undefined) ?? 'system'
  const CurrentIcon = MODE_ICON[mode]

  return (
    <>
      <Tooltip title={t('theme.label')}>
        <IconButton
          aria-label={t('theme.label')}
          aria-haspopup="menu"
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <CurrentIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {MODES.map((value) => {
          const Icon = MODE_ICON[value]
          return (
            <MenuItem
              key={value}
              selected={value === mode}
              onClick={() => {
                colorScheme?.setMode(value)
                setAnchorEl(null)
              }}
            >
              <ListItemIcon>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t(`theme.${value}`)}</ListItemText>
            </MenuItem>
          )
        })}
      </Menu>
    </>
  )
}
