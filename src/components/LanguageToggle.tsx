import { useState } from 'react'

import CheckIcon from '@mui/icons-material/Check'
import LanguageIcon from '@mui/icons-material/Language'
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material'
import { useTranslation } from 'react-i18next'

import {
  LANGUAGE_NATIVE_NAMES,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
} from '@/i18n'

export function LanguageToggle() {
  const { t, i18n } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const current = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)

  return (
    <>
      <Tooltip title={t('language.label')}>
        <IconButton
          aria-label={t('language.label')}
          aria-haspopup="menu"
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <LanguageIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <MenuItem
            key={lng}
            selected={lng === current}
            onClick={() => {
              void i18n.changeLanguage(lng)
              window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng)
              setAnchorEl(null)
            }}
          >
            <ListItemIcon>{lng === current ? <CheckIcon fontSize="small" /> : null}</ListItemIcon>
            <ListItemText>{LANGUAGE_NATIVE_NAMES[lng]}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
