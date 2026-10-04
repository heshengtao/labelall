import { useCallback } from 'react'

import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next'

import type { ImageRecord } from '@/core/model'
import { useThumbnail } from '@/features/imagelist/useThumbnail'

/** The 64px strip only needs a small decode. */
const THUMBNAIL_EDGE = 128

interface FilmstripThumbProps {
  image: ImageRecord
  active: boolean
  onClick: () => void
  resolveImageUrl: (relPath: string) => Promise<string>
}

function FilmstripThumb({ image, active, onClick, resolveImageUrl }: FilmstripThumbProps) {
  const url = useThumbnail(resolveImageUrl, image.filePath, THUMBNAIL_EDGE)

  // Scroll the thumbnail into view when it becomes active. A ref callback
  // (rather than an effect) keeps this a pure post-commit side effect.
  const scrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && active) {
        node.scrollIntoView?.({ block: 'nearest', inline: 'center' })
      }
    },
    [active],
  )

  return (
    <Box
      ref={scrollRef}
      data-active={active}
      onClick={onClick}
      sx={{
        flex: '0 0 auto',
        width: 64,
        height: 64,
        borderRadius: 1,
        overflow: 'hidden',
        border: 2,
        borderColor: active ? 'primary.main' : 'transparent',
        bgcolor: 'action.hover',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {url ? (
        <Box
          component="img"
          src={url}
          alt={image.fileName ?? image.filePath}
          sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        />
      ) : null}
    </Box>
  )
}

export interface FilmstripProps {
  images: ImageRecord[]
  currentIndex: number
  resolveImageUrl: (relPath: string) => Promise<string>
  onSelect: (index: number) => void
}

/** Only the images around the current one are mounted, so huge sets stay cheap. */
const WINDOW = 20

export function Filmstrip({ images, currentIndex, resolveImageUrl, onSelect }: FilmstripProps) {
  const { t } = useTranslation()

  const start = Math.max(0, currentIndex - WINDOW)
  const end = Math.min(images.length, currentIndex + WINDOW + 1)
  const visible = images.slice(start, end)

  return (
    <Box
      aria-label={t('viewer.filmstrip')}
      sx={{
        display: 'flex',
        gap: 0.5,
        overflowX: 'auto',
        p: 1,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      {visible.map((image, offset) => {
        const index = start + offset
        return (
          <FilmstripThumb
            key={image.id}
            image={image}
            active={index === currentIndex}
            onClick={() => onSelect(index)}
            resolveImageUrl={resolveImageUrl}
          />
        )
      })}
    </Box>
  )
}
