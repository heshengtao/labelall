import { useEffect, useState } from 'react'

import { Box, Card, Chip, Stack, Typography } from '@mui/material'

import type { ImageRecord } from '@/core/model'

export interface ImageCellProps {
  image: ImageRecord
  selected: boolean
  onSelect: (imageId: number) => void
  /** Double-click: open this image in the viewer. */
  onOpen: (imageId: number) => void
  resolveImageUrl: (relPath: string) => Promise<string>
}

export function ImageCell({ image, selected, onSelect, onOpen, resolveImageUrl }: ImageCellProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    resolveImageUrl(image.filePath).then(
      (value) => {
        if (!cancelled) setUrl(value)
      },
      () => {
        if (!cancelled) setUrl(null)
      },
    )
    return () => {
      cancelled = true
    }
  }, [image.filePath, resolveImageUrl])

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
            loading="lazy"
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
