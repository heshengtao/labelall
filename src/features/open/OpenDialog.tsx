import { useState } from 'react'

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  Radio,
  Stack,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import type { DetectionCandidate } from '@/core/formats/detect'
import { READABLE_FORMATS } from '@/core/formats/dispatch'

const FORMAT_LABEL: Record<string, string> = {
  coco: 'COCO',
  yolo: 'YOLO (detect)',
  'yolo-seg': 'YOLO (segment)',
  'yolo-pose': 'YOLO (pose)',
  mindyolo: 'MindYOLO',
  voc: 'Pascal VOC',
  imagefolder: 'ImageFolder / ImageNet',
  labelme: 'labelme',
  csv: 'CSV',
  other: 'Other',
}

export interface OpenDialogProps {
  open: boolean
  candidates: DetectionCandidate[]
  imageCount: number
  busy: boolean
  onConfirm: (candidate: DetectionCandidate) => void
  onCancel: () => void
}

function firstReadable(candidates: DetectionCandidate[]): number {
  const index = candidates.findIndex((candidate) => READABLE_FORMATS.has(candidate.format))
  return index >= 0 ? index : 0
}

export function OpenDialog({
  open,
  candidates,
  imageCount,
  busy,
  onConfirm,
  onCancel,
}: OpenDialogProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(() => firstReadable(candidates))
  const [seen, setSeen] = useState(candidates)

  // Reset the selection when a new detection result arrives. Deriving it during
  // render (instead of an effect) avoids a second render pass.
  if (candidates !== seen) {
    setSeen(candidates)
    setSelected(firstReadable(candidates))
  }

  const chosen = candidates[selected]
  const canConfirm = !busy && chosen !== undefined && READABLE_FORMATS.has(chosen.format)

  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{t('open.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('open.imagesInFolder', { count: imageCount })}
          </Typography>

          {candidates.length === 0 ? (
            <Alert severity="warning">{t('open.noCandidates')}</Alert>
          ) : (
            <List dense>
              {candidates.map((candidate, index) => {
                const readable = READABLE_FORMATS.has(candidate.format)
                return (
                  <ListItemButton
                    key={`${candidate.format}:${candidate.reason}`}
                    selected={index === selected}
                    disabled={!readable}
                    onClick={() => setSelected(index)}
                  >
                    <Radio checked={index === selected} disabled={!readable} tabIndex={-1} />
                    <ListItemText
                      primary={`${FORMAT_LABEL[candidate.format] ?? candidate.format} · ${Math.round(
                        candidate.confidence * 100,
                      )}%`}
                      secondary={readable ? candidate.reason : t('open.unsupported')}
                    />
                  </ListItemButton>
                )
              })}
            </List>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => chosen && onConfirm(chosen)}
          disabled={!canConfirm}
        >
          {t('open.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
