import { Box, Link } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { navigateToLegal } from '@/legal/route'

/** Persistent way back into the policies once the item has been dismissed. */
export function LegalFooter() {
  const { t } = useTranslation()

  return (
    <Box
      component="footer"
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: 2,
        py: 0.5,
        display: 'flex',
        gap: 2,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Link component="button" variant="caption" onClick={() => navigateToLegal('privacy')}>
        {t('legal.privacy')}
      </Link>
      <Link component="button" variant="caption" onClick={() => navigateToLegal('terms')}>
        {t('legal.terms')}
      </Link>
    </Box>
  )
}
