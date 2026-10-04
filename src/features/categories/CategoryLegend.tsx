import { useMemo } from 'react'

import { Box, Stack, Typography } from '@mui/material'

import type { Annotation, Category } from '@/core/model'

export interface CategoryLegendProps {
  categories: readonly Category[]
  annotations: readonly Annotation[]
}

/** A compact row of class colour swatches with each class's annotation count. */
export function CategoryLegend({ categories, annotations }: CategoryLegendProps) {
  const counts = useMemo(() => {
    const map = new Map<number, number>()
    for (const annotation of annotations) {
      map.set(annotation.categoryId, (map.get(annotation.categoryId) ?? 0) + 1)
    }
    return map
  }, [annotations])

  if (categories.length === 0) {
    return null
  }

  return (
    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
      {categories.map((category) => (
        <Stack key={category.id} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '2px',
              bgcolor: category.color ?? '#8a8a8a',
            }}
          />
          <Typography variant="caption">{category.displayName ?? category.name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {counts.get(category.id) ?? 0}
          </Typography>
        </Stack>
      ))}
    </Stack>
  )
}
