import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useColorScheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import { APP_VERSION } from '@/appVersion'
import { ColorFieldWithReset } from '@/components/ColorField'
import { SEED_COLUMNS, SEED_PRESETS } from '@/components/presets'
import type { ExportChoice } from '@/core/formats/losses'
import {
  LANGUAGE_NATIVE_NAMES,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
} from '@/i18n'
import { navigateToLegal } from '@/legal/route'
import { isDemoSite } from '@/platform/demoSite'
import { useSettingsStore } from '@/store/settingsStore'
import { useUiStore } from '@/store/uiStore'
import { useUpdateStore } from '@/store/updateStore'
import { DEFAULT_SEED } from '@/theme/md3'

const EXPORT_FORMATS: ExportChoice[] = [
  'coco',
  'yolo',
  'mindyolo',
  'voc',
  'imagefolder',
  'labelme',
  'csv',
]
const MODES = ['light', 'dark', 'system'] as const

export function SettingsDialog() {
  const { t, i18n } = useTranslation()
  const open = useUiStore((state) => state.settingsOpen)
  const setOpen = useUiStore((state) => state.setSettingsOpen)

  const seed = useSettingsStore((state) => state.seed)
  const setSeed = useSettingsStore((state) => state.setSeed)
  const defaultExportFormat = useSettingsStore((state) => state.defaultExportFormat)
  const setDefaultExportFormat = useSettingsStore((state) => state.setDefaultExportFormat)

  const colorScheme = useColorScheme()
  const mode = colorScheme?.mode ?? 'system'
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
  const demoSite = isDemoSite()

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle>{t('settings.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <ColorFieldWithReset
            label={t('settings.seed')}
            value={seed}
            onChange={setSeed}
            onReset={() => setSeed(DEFAULT_SEED)}
            resetLabel={t('settings.reset')}
            presets={SEED_PRESETS}
            columns={SEED_COLUMNS}
          />

          <TextField
            select
            size="small"
            label={t('settings.defaultFormat')}
            value={defaultExportFormat}
            onChange={(event) => setDefaultExportFormat(event.target.value as ExportChoice)}
          >
            {EXPORT_FORMATS.map((value) => (
              <MenuItem key={value} value={value}>
                {t(`export.${value}`)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label={t('theme.label')}
            value={mode}
            onChange={(event) =>
              colorScheme?.setMode(event.target.value as 'light' | 'dark' | 'system')
            }
          >
            {MODES.map((value) => (
              <MenuItem key={value} value={value}>
                {t(`theme.${value}`)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label={t('language.label')}
            value={language}
            onChange={(event) => {
              void i18n.changeLanguage(event.target.value)
              window.localStorage.setItem(LANGUAGE_STORAGE_KEY, event.target.value)
            }}
          >
            {SUPPORTED_LANGUAGES.map((value) => (
              <MenuItem key={value} value={value}>
                {LANGUAGE_NATIVE_NAMES[value]}
              </MenuItem>
            ))}
          </TextField>

          <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
            <Button
              size="small"
              startIcon={<SystemUpdateAltIcon />}
              onClick={() =>
                void useUpdateStore
                  .getState()
                  .checkForUpdates()
                  .then(() => setOpen(false))
              }
            >
              {t('update.check')}
            </Button>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('settings.version', { version: APP_VERSION })}
            </Typography>
          </Stack>

          {demoSite ? (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Button
                size="small"
                onClick={() => {
                  navigateToLegal('privacy')
                  setOpen(false)
                }}
              >
                {t('legal.privacy')}
              </Button>
              <Button
                size="small"
                onClick={() => {
                  navigateToLegal('terms')
                  setOpen(false)
                }}
              >
                {t('legal.terms')}
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  )
}
