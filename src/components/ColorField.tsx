import { useState } from 'react'

import { Box, Button, Divider, Menu, Stack, TextField, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { PALETTE_COLUMNS, PALETTE_GRID, SEED_COLUMNS, SEED_PRESETS } from './presets'

export interface ColorFieldProps {
  label: string
  value: string
  onChange: (color: string) => void
  /** Preset swatches, laid out `columns` per row. */
  presets?: readonly string[]
  columns?: number
  /** Render as a single swatch that opens a menu, for tight rows. */
  compact?: boolean
}

function isHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value.trim())
}

function Swatch({
  color,
  active,
  onPick,
}: {
  color: string
  active: boolean
  onPick: (color: string) => void
}) {
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={color}
      onClick={() => onPick(color)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onPick(color)
        }
      }}
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        bgcolor: color,
        border: 1,
        borderColor: 'divider',
        cursor: 'pointer',
        outline: active ? '2px solid' : 'none',
        outlineOffset: 2,
        outlineColor: 'text.primary',
      }}
    />
  )
}

/**
 * MD3 colour picker: a preset grid, a generated palette and a hex field.
 * Deliberately avoids `<input type="color">`, which is a native OS control and
 * cannot be themed.
 */
export function ColorField({
  label,
  value,
  onChange,
  presets = SEED_PRESETS,
  columns = SEED_COLUMNS,
  compact = false,
}: ColorFieldProps) {
  const { t } = useTranslation()
  const [text, setText] = useState(value)
  const [seen, setSeen] = useState(value)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  // Keep the hex field in sync when the value changes elsewhere (e.g. reset).
  if (value !== seen) {
    setSeen(value)
    setText(value)
  }

  const pick = (color: string): void => {
    onChange(color)
    setAnchor(null)
  }

  const grid = (colors: readonly string[], cols: number) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 24px)`, gap: 0.75 }}>
      {colors.map((color) => (
        <Swatch
          key={color}
          color={color}
          active={value.toLowerCase() === color.toLowerCase()}
          onPick={pick}
        />
      ))}
    </Box>
  )

  const content = (
    <Stack spacing={1.5}>
      <Typography variant="body2">{label}</Typography>
      {grid(presets, columns)}
      <Divider />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {t('settings.palette')}
      </Typography>
      {grid(PALETTE_GRID, PALETTE_COLUMNS)}
      <TextField
        size="small"
        label={t('settings.hex')}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          if (isHex(text)) {
            onChange(text.trim())
          } else {
            setText(value)
          }
        }}
        sx={{ minWidth: 120, mt: 0.5 }}
      />
    </Stack>
  )

  if (compact) {
    return (
      <>
        <Box
          role="button"
          tabIndex={0}
          aria-label={label}
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{
            width: 32,
            height: 32,
            flex: '0 0 auto',
            borderRadius: 1,
            bgcolor: value,
            border: 1,
            borderColor: 'divider',
            cursor: 'pointer',
          }}
        />
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <Box sx={{ p: 2, width: 24 * PALETTE_COLUMNS + 6 * (PALETTE_COLUMNS - 1) + 32 }}>
            {content}
          </Box>
        </Menu>
      </>
    )
  }

  return content
}

export interface ColorFieldButtonProps extends ColorFieldProps {
  onReset?: () => void
  resetLabel?: string
}

/** Inline colour field with an optional reset action. */
export function ColorFieldWithReset({ onReset, resetLabel, ...props }: ColorFieldButtonProps) {
  return (
    <Stack spacing={1.5}>
      <ColorField {...props} />
      {onReset ? (
        <Button size="small" onClick={onReset} sx={{ alignSelf: 'flex-start' }}>
          {resetLabel}
        </Button>
      ) : null}
    </Stack>
  )
}
