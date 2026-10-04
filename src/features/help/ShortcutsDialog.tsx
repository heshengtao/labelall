import { Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { useUiStore } from '@/store/uiStore'

const SHORTCUTS: Array<{ keys: string; labelKey: string }> = [
  { keys: 'V', labelKey: 'shortcuts.select' },
  { keys: 'B', labelKey: 'shortcuts.bbox' },
  { keys: 'N', labelKey: 'shortcuts.polygon' },
  { keys: 'M', labelKey: 'shortcuts.keypoint' },
  { keys: '← →', labelKey: 'shortcuts.navigate' },
  { keys: '↑ ↓', labelKey: 'shortcuts.cycleCategory' },
  { keys: 'W A S D', labelKey: 'shortcuts.nudge' },
  { keys: 'Shift + W A S D', labelKey: 'shortcuts.nudgeLarge' },
  { keys: 'Delete', labelKey: 'shortcuts.delete' },
  { keys: 'Ctrl/Cmd + D', labelKey: 'shortcuts.duplicate' },
  { keys: 'Ctrl/Cmd + Z', labelKey: 'shortcuts.undo' },
  { keys: 'Ctrl/Cmd + Shift + Z', labelKey: 'shortcuts.redo' },
  { keys: 'Ctrl/Cmd + S', labelKey: 'shortcuts.save' },
  { keys: '+ / -', labelKey: 'shortcuts.zoom' },
  { keys: '0', labelKey: 'shortcuts.fit' },
  { keys: 'Space + drag', labelKey: 'shortcuts.pan' },
  { keys: '?, Esc', labelKey: 'shortcuts.help' },
]

export function ShortcutsDialog() {
  const { t } = useTranslation()
  const open = useUiStore((state) => state.helpOpen)
  const setOpen = useUiStore((state) => state.setHelpOpen)

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{t('shortcuts.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          {SHORTCUTS.map(({ keys, labelKey }) => (
            <Stack
              key={labelKey}
              direction="row"
              spacing={2}
              sx={{ justifyContent: 'space-between' }}
            >
              <Typography variant="body2">{t(labelKey)}</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                {keys}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
