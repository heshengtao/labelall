import { useState } from 'react'

import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined'
import {
  AppBar,
  Box,
  Chip,
  CssBaseline,
  Snackbar,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import { LanguageToggle } from '@/components/LanguageToggle'
import { ThemeModeToggle } from '@/components/ThemeModeToggle'
import { WelcomeView } from '@/components/WelcomeView'
import { detectRuntimeEnv } from '@/platform/detect-env'

export default function App() {
  const { t } = useTranslation()
  const [toast, setToast] = useState<string | null>(null)
  const runtimeEnv = detectRuntimeEnv()

  return (
    <>
      <CssBaseline />
      <AppBar
        position="static"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <DatasetOutlinedIcon color="primary" />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, mr: 1 }}>
            {t('app.name')}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', display: { xs: 'none', md: 'block' } }}
          >
            {t('app.tagline')}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Tooltip title={t('actions.openDataset')}>
            <Chip
              size="small"
              variant="outlined"
              label={runtimeEnv === 'tauri' ? t('env.desktop') : t('env.web')}
              sx={{ mr: 1 }}
            />
          </Tooltip>
          <ThemeModeToggle />
          <LanguageToggle />
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}
      >
        <Stack sx={{ flex: 1 }}>
          <WelcomeView onOpenDataset={() => setToast(t('common.comingSoon'))} />
        </Stack>
      </Box>

      <Snackbar
        open={toast !== null}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast ?? ''}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}
