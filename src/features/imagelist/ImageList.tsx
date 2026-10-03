import { useMemo, useState } from 'react'

import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import type { DatasetModel } from '@/core/model'
import { useUiStore } from '@/store/uiStore'

import { ImageCell } from './ImageCell'
import { VirtualGrid } from './VirtualGrid'
import { collectSplits, filterImages } from './grid'

export interface ImageListProps {
  dataset: DatasetModel
  selectedId: number | null
  onSelect: (imageId: number) => void
  resolveImageUrl: (relPath: string) => Promise<string>
}

const ROW_HEIGHT = 158
const MIN_COLUMN_WIDTH = 168
const GAP = 12

export function ImageList({ dataset, selectedId, onSelect, resolveImageUrl }: ImageListProps) {
  const { t } = useTranslation()
  const setViewMode = useUiStore((state) => state.setViewMode)
  const [split, setSplit] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')
  const [query, setQuery] = useState('')

  const splits = useMemo(() => collectSplits(dataset.images), [dataset.images])
  const images = useMemo(
    () =>
      filterImages(dataset.images, dataset.annotations, {
        split,
        categoryId: category === 'all' ? 'all' : Number(category),
        query,
      }),
    [dataset.images, dataset.annotations, split, category, query],
  )

  return (
    <Stack sx={{ flex: 1, minHeight: 0 }}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ p: 1.5, alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}
      >
        <TextField
          size="small"
          label={t('imagelist.search')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ minWidth: 200 }}
        />
        {splits.length > 0 ? (
          <TextField
            select
            size="small"
            label={t('imagelist.split')}
            value={split}
            onChange={(event) => setSplit(event.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">{t('imagelist.allSplits')}</MenuItem>
            {splits.map((value) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
        <TextField
          select
          size="small"
          label={t('imagelist.category')}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">{t('imagelist.allCategories')}</MenuItem>
          {dataset.categories.map((item) => (
            <MenuItem key={item.id} value={String(item.id)}>
              {item.name}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('imagelist.shown', { shown: images.length, total: dataset.images.length })}
        </Typography>
      </Stack>

      {images.length === 0 ? (
        <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('imagelist.empty')}
          </Typography>
        </Stack>
      ) : (
        <VirtualGrid
          items={images}
          minColumnWidth={MIN_COLUMN_WIDTH}
          rowHeight={ROW_HEIGHT}
          gap={GAP}
          getKey={(image) => image.id}
          renderItem={(image) => (
            <ImageCell
              image={image}
              selected={image.id === selectedId}
              onSelect={onSelect}
              onOpen={(imageId) => {
                onSelect(imageId)
                setViewMode('viewer')
              }}
              resolveImageUrl={resolveImageUrl}
            />
          )}
        />
      )}
    </Stack>
  )
}
