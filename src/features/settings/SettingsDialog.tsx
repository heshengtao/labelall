import DeleteIcon from '@mui/icons-material/Delete'
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useColorScheme,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import { ColorFieldWithReset } from '@/components/ColorField'
import { SEED_COLUMNS, SEED_PRESETS } from '@/components/presets'
import type { ExportChoice } from '@/core/formats/losses'
import { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, normalizeLanguage } from '@/i18n'
import { useSettingsStore } from '@/store/settingsStore'
import { useUiStore } from '@/store/uiStore'
import { useUpdateStore } from '@/store/updateStore'
import { DEFAULT_SEED } from '@/theme/md3'

const EXPORT_FORMATS: ExportChoice[] = ['coco', 'yolo', 'voc', 'imagefolder']
const MODES = ['light', 'dark', 'system'] as const
const LANGUAGE_LABEL: Record<string, string> = { 'zh-CN': 'language.zh', 'en-US': 'language.en' }

export function SettingsDialog() {
  const { t, i18n } = useTranslation()
  const open = useUiStore((state) => state.settingsOpen)
  const setOpen = useUiStore((state) => state.setSettingsOpen)

  const seed = useSettingsStore((state) => state.seed)
  const setSeed = useSettingsStore((state) => state.setSeed)
  const defaultExportFormat = useSettingsStore((state) => state.defaultExportFormat)
  const setDefaultExportFormat = useSettingsStore((state) => state.setDefaultExportFormat)
  const recent = useSettingsStore((state) => state.recent)
  const forgetDataset = useSettingsStore((state) => state.forgetDataset)

  const colorScheme = useColorScheme()
  const mode = colorScheme?.mode ?? 'system'
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)

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
                {t(LANGUAGE_LABEL[value])}
              </MenuItem>
            ))}
          </TextField>

          <Button
            size="small"
            startIcon={<SystemUpdateAltIcon />}
            onClick={() =>
              void useUpdateStore
                .getState()
                .checkForUpdates()
                .then(() => setOpen(false))
            }
            sx={{ alignSelf: 'flex-start' }}
          >
            {t('update.check')}
          </Button>

          {recent.length > 0 ? (
            <Stack spacing={0.5}>
              <Typography variant="body2">{t('settings.recent')}</Typography>
              {recent.map((item) => (
                <Stack key={item.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                    {item.displayName}
                  </Typography>
                  <IconButton size="small" onClick={() => forgetDataset(item.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
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
