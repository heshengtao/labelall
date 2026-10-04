import { Box, Card, Chip, Stack, Typography } from '@mui/material'

import type { ImageRecord } from '@/core/model'

import { useThumbnail } from './useThumbnail'
import type { ThumbnailRenderer } from './thumbnail'

/** Decoded at 2× the 120px preview box so it stays sharp on HiDPI screens. */
const THUMBNAIL_EDGE = 320

export interface ImageCellProps {
  image: ImageRecord
  selected: boolean
  onSelect: (imageId: number) => void
  /** Double-click: open this image in the viewer. */
  onOpen: (imageId: number) => void
  resolveThumbnail: ThumbnailRenderer
}

export function ImageCell({ image, selected, onSelect, onOpen, resolveThumbnail }: ImageCellProps) {
  const url = useThumbnail(resolveThumbnail, image.filePath, THUMBNAIL_EDGE)

  return (
    <Card
      variant="outlined"
      onClick={() => onSelect(image.id)}
      onDoubleClick={() => onOpen(image.id)}
      sx={{
        cursor: 'pointer',
        height: '100%',
        borderColor: selected ? 'primary.main' : undefined,
        borderWidth: selected ? 2 : 1,
      }}
    >
      <Box
        sx={{
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          bgcolor: 'action.hover',
        }}
      >
        {url ? (
          <Box
            component="img"
            src={url}
            alt={image.fileName ?? image.filePath}
            decoding="async"
            sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : null}
      </Box>
      <Stack direction="row" spacing={0.5} sx={{ px: 1, py: 0.5, alignItems: 'center' }}>
        <Typography variant="caption" noWrap sx={{ flex: 1 }}>
          {image.fileName ?? image.filePath}
        </Typography>
        {image.split ? <Chip size="small" label={image.split} /> : null}
      </Stack>
    </Card>
  )
}
