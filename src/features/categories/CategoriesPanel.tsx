import { useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import type { Category } from '@/core/model'
import { useDatasetStore } from '@/store/datasetStore'
import { useUiStore } from '@/store/uiStore'

interface CategoryRowProps {
  category: Category
  onUpdate: (id: number, patch: Partial<Category>) => void
  onDelete: (id: number) => void
}

function CategoryRow({ category, onUpdate, onDelete }: CategoryRowProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(category.name)
  const [supercategory, setSupercategory] = useState(category.supercategory ?? '')
  const [color, setColor] = useState(category.color ?? '#888888')

  return (
    <Stack spacing={1} sx={{ py: 1 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Box
          component="input"
          type="color"
          value={color}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setColor(event.target.value)}
          onBlur={() => color !== category.color && onUpdate(category.id, { color })}
          sx={{
            width: 32,
            height: 32,
            p: 0,
            border: 'none',
            borderRadius: 1,
            bgcolor: 'transparent',
            cursor: 'pointer',
          }}
        />
        <TextField
          size="small"
          label={t('categories.name')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => name !== category.name && onUpdate(category.id, { name })}
          fullWidth
        />
        <Tooltip title={t('categories.delete')}>
          <IconButton size="small" onClick={() => onDelete(category.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <TextField
        size="small"
        label={t('categories.supercategory')}
        value={supercategory}
        onChange={(event) => setSupercategory(event.target.value)}
        onBlur={() =>
          supercategory !== (category.supercategory ?? '') &&
          onUpdate(category.id, { supercategory })
        }
      />
    </Stack>
  )
}

export function CategoriesPanel() {
  const { t } = useTranslation()
  const open = useUiStore((state) => state.categoriesOpen)
  const setOpen = useUiStore((state) => state.setCategoriesOpen)
  const dataset = useDatasetStore((state) => state.dataset)
  const addCategory = useDatasetStore((state) => state.addCategory)
  const updateCategory = useDatasetStore((state) => state.updateCategory)
  const deleteCategory = useDatasetStore((state) => state.deleteCategory)
  const [newName, setNewName] = useState('')

  const add = (): void => {
    addCategory(newName)
    setNewName('')
  }

  return (
    <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
      <Stack sx={{ width: 360, p: 2 }} spacing={1}>
        <Typography variant="h6">{t('categories.title')}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('categories.hint')}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
          <TextField
            size="small"
            label={t('categories.newCategory')}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') add()
            }}
            fullWidth
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={add}>
            {t('common.add')}
          </Button>
        </Stack>

        <Divider sx={{ my: 1 }} />

        <Box sx={{ overflowY: 'auto' }}>
          {dataset?.categories.map((category) => (
            <CategoryRow
              key={`${category.id}:${category.name}:${category.color ?? ''}:${category.supercategory ?? ''}`}
              category={category}
              onUpdate={updateCategory}
              onDelete={deleteCategory}
            />
          ))}
        </Box>
      </Stack>
    </Drawer>
  )
}
