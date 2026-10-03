import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

interface WelcomeFeature {
  icon: typeof FolderOpenOutlinedIcon
  titleKey: string
  descriptionKey: string
}

const FEATURES: WelcomeFeature[] = [
  {
    icon: CategoryOutlinedIcon,
    titleKey: 'welcome.featureFormats',
    descriptionKey: 'welcome.featureFormatsDesc',
  },
  {
    icon: AddPhotoAlternateOutlinedIcon,
    titleKey: 'welcome.featureAnnotate',
    descriptionKey: 'welcome.featureAnnotateDesc',
  },
  {
    icon: DevicesOutlinedIcon,
    titleKey: 'welcome.featureCrossPlatform',
    descriptionKey: 'welcome.featureCrossPlatformDesc',
  },
]

export interface WelcomeViewProps {
  onOpenDataset: () => void
}

export function WelcomeView({ onOpenDataset }: WelcomeViewProps) {
  const { t } = useTranslation()

  return (
    <Stack
      spacing={4}
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        px: 3,
        py: 6,
        textAlign: 'center',
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center', maxWidth: 560 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
          {t('welcome.title')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {t('welcome.subtitle')}
        </Typography>
        <Button
          size="large"
          variant="contained"
          startIcon={<FolderOpenOutlinedIcon />}
          onClick={onOpenDataset}
          sx={{ mt: 1 }}
        >
          {t('actions.openDataset')}
        </Button>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('welcome.openHint')}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          width: '100%',
          maxWidth: 880,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        }}
      >
        {FEATURES.map(({ icon: Icon, titleKey, descriptionKey }) => (
          <Card key={titleKey} variant="outlined" sx={{ textAlign: 'left' }}>
            <CardContent>
              <Icon color="primary" sx={{ mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {t(titleKey)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t(descriptionKey)}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  )
}
