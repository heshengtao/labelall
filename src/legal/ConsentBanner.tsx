import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { navigateToLegal } from '@/legal/route'
import { useLegalStore } from '@/store/legalStore'

/**
 * Informational storage notice, not a consent gate: the app sets no cookies of
 * its own and stores only preferences, so nothing needs to be blocked behind it.
 */
export function ConsentBanner() {
  const { t } = useTranslation()
  const open = useLegalStore((state) => state.noticeOpen)
  const dismiss = useLegalStore((state) => state.dismissNotice)

  if (!open) {
    return null
  }

  return (
    <Paper
      component="aside"
      elevation={8}
      square
      sx={{
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.snackbar,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: 2,
        py: 1.5,
        pb: 'calc(12px + env(safe-area-inset-bottom))',
        maxHeight: '60vh',
        overflowY: 'auto',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { sm: 'center' } }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">{t('legal.bannerTitle')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('legal.bannerBody')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Button size="small" onClick={() => navigateToLegal('privacy')}>
            {t('legal.privacy')}
          </Button>
          <Button size="small" onClick={() => navigateToLegal('terms')}>
            {t('legal.terms')}
          </Button>
          <Button size="small" variant="contained" onClick={dismiss}>
            {t('legal.bannerAccept')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
