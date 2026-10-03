import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import FitScreenIcon from '@mui/icons-material/FitScreen'
import { Divider, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'
import { useTranslation } from 'react-i18next'

export interface CanvasContextMenuState {
  /** Screen position of the right-click. */
  x: number
  y: number
  /** Annotation under the pointer, or null for the empty canvas. */
  index: number | null
}

export interface CanvasContextMenuProps {
  state: CanvasContextMenuState | null
  onClose: () => void
  onDelete: (index: number) => void
  onDuplicate: (index: number) => void
  onFit: () => void
  onDeselect: () => void
}

/** MD3 right-click menu for the viewer; every item is translated. */
export function CanvasContextMenu({
  state,
  onClose,
  onDelete,
  onDuplicate,
  onFit,
  onDeselect,
}: CanvasContextMenuProps) {
  const { t } = useTranslation()
  const index = state?.index ?? null

  return (
    <Menu
      open={state !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={state ? { top: state.y, left: state.x } : undefined}
      slotProps={{ list: { dense: true } }}
    >
      {index !== null
        ? [
            <MenuItem
              key="duplicate"
              onClick={() => {
                onDuplicate(index)
                onClose()
              }}
            >
              <ListItemIcon>
                <ContentCopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('annotate.duplicate')}</ListItemText>
            </MenuItem>,
            <Divider key="divider" />,
            <MenuItem
              key="delete"
              onClick={() => {
                onDelete(index)
                onClose()
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('annotate.delete')}</ListItemText>
            </MenuItem>,
          ]
        : [
            <MenuItem
              key="fit"
              onClick={() => {
                onFit()
                onClose()
              }}
            >
              <ListItemIcon>
                <FitScreenIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('viewer.fit')}</ListItemText>
            </MenuItem>,
            <Divider key="divider" />,
            <MenuItem
              key="deselect"
              onClick={() => {
                onDeselect()
                onClose()
              }}
            >
              <ListItemText inset>{t('context.deselect')}</ListItemText>
            </MenuItem>,
          ]}
    </Menu>
  )
}
