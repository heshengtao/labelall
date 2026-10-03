import { useState } from 'react'

import { Box, Button, Menu, Stack, TextField, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { PALETTE } from '@/core/palette'

export interface ColorFieldProps {
  label: string
  value: string
  onChange: (color: string) => void
  /** Render as a single swatch that opens a menu, for tight rows. */
  compact?: boolean
}

function isHex(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value.trim())
}

/**
 * MD3 colour picker: a preset palette plus a hex field. Deliberately avoids
 * `<input type="color">`, which is a native OS control and cannot be themed.
 */
export function ColorField({ label, value, onChange, compact = false }: ColorFieldProps) {
  const { t } = useTranslation()
  const [text, setText] = useState(value)
  const [seen, setSeen] = useState(value)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  // Keep the hex field in sync when the value changes elsewhere (e.g. reset).
  if (value !== seen) {
    setSeen(value)
    setText(value)
  }

  const swatches = (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
      {PALETTE.map((color) => (
        <Box
          key={color}
          role="button"
          tabIndex={0}
          aria-label={color}
          onClick={() => {
            onChange(color)
            setAnchor(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              onChange(color)
              setAnchor(null)
            }
          }}
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: color,
            cursor: 'pointer',
            outline: value.toLowerCase() === color.toLowerCase() ? '2px solid' : 'none',
            outlineOffset: 2,
            outlineColor: 'text.primary',
          }}
        />
      ))}
    </Stack>
  )

  const hexField = (
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
      sx={{ minWidth: 120 }}
    />
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
          <Stack spacing={1.5} sx={{ p: 1.5, width: 240 }}>
            {swatches}
            {hexField}
          </Stack>
        </Menu>
      </>
    )
  }

  return (
    <Stack spacing={1}>
      <Typography variant="body2">{label}</Typography>
      {swatches}
      {hexField}
    </Stack>
  )
}

export interface ColorFieldButtonProps extends ColorFieldProps {
  onReset?: () => void
  resetLabel?: string
}

/** Inline colour field with an optional reset action. */
export function ColorFieldWithReset({ onReset, resetLabel, ...props }: ColorFieldButtonProps) {
  return (
    <Stack spacing={1}>
      <ColorField {...props} />
      {onReset ? (
        <Button size="small" onClick={onReset} sx={{ alignSelf: 'flex-start' }}>
          {resetLabel}
        </Button>
      ) : null}
    </Stack>
  )
}
