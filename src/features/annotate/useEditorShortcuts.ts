import { useEffect } from 'react'

import { constrainTranslation, translateAnnotation } from '@/core/annotationEdits'
import { useDatasetStore } from '@/store/datasetStore'
import { useUiStore } from '@/store/uiStore'

export interface EditorShortcutHandlers {
  zoomIn: () => void
  zoomOut: () => void
  fit: () => void
  navigate: (delta: number) => void
  /** Decoded image size, used to keep nudged annotations inside the image. */
  bounds: { width: number; height: number }
}

function isTextInput(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  return Boolean(
    element &&
    (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable),
  )
}

/**
 * Global editor shortcuts. Arrow keys nudge the selected annotation, and fall
 * back to image navigation when nothing is selected.
 */
export function useEditorShortcuts(handlers: EditorShortcutHandlers): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isTextInput(event.target)) {
        return
      }
      const state = useDatasetStore.getState()
      const ui = useUiStore.getState()
      const mod = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (mod && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          state.redo()
        } else {
          state.undo()
        }
        return
      }
      if (mod && key === 'd') {
        if (state.selectedAnnotationIndex !== null) {
          event.preventDefault()
          state.duplicateAnnotation(state.selectedAnnotationIndex)
        }
        return
      }
      if (mod) {
        return
      }

      // Nudge the selected annotation: W/A/S/D by 1px, +Shift by 10px.
      const nudgeStep = event.shiftKey ? 10 : 1
      const nudgeDx = key === 'a' ? -nudgeStep : key === 'd' ? nudgeStep : 0
      const nudgeDy = key === 'w' ? -nudgeStep : key === 's' ? nudgeStep : 0
      if (nudgeDx !== 0 || nudgeDy !== 0) {
        const index = state.selectedAnnotationIndex
        if (index !== null) {
          event.preventDefault()
          const annotation = state.dataset?.annotations[index]
          const moved = annotation
            ? constrainTranslation(
                annotation,
                nudgeDx,
                nudgeDy,
                handlers.bounds.width,
                handlers.bounds.height,
              )
            : { dx: nudgeDx, dy: nudgeDy }
          // A nudge that the image edge blocks is not an edit at all.
          if (moved.dx !== 0 || moved.dy !== 0) {
            state.updateAnnotation(
              index,
              (item) => translateAnnotation(item, moved.dx, moved.dy),
              'nudge',
            )
          }
        }
        return
      }

      switch (event.key) {
        case 'v':
          ui.setTool('select')
          return
        case 'b':
          ui.setTool('bbox')
          return
        case 'n':
          ui.setTool('polygon')
          return
        case 'm':
          ui.setTool('keypoint')
          return
        case '?':
          ui.setHelpOpen(true)
          return
        case 'Delete':
        case 'Backspace':
          if (state.selectedAnnotationIndex !== null) {
            event.preventDefault()
            state.deleteAnnotation(state.selectedAnnotationIndex)
          }
          return
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp':
        case 'ArrowDown': {
          if (event.key === 'ArrowLeft') {
            handlers.navigate(-1)
          } else if (event.key === 'ArrowRight') {
            handlers.navigate(1)
          } else {
            const categories = state.dataset?.categories ?? []
            if (categories.length > 0) {
              event.preventDefault()
              const current = categories.findIndex(
                (category) => category.id === ui.activeCategoryId,
              )
              const step = event.key === 'ArrowDown' ? 1 : -1
              const base = current < 0 ? (step > 0 ? -1 : 0) : current
              ui.setActiveCategory(
                categories[(base + step + categories.length) % categories.length].id,
              )
            }
          }
          return
        }
        case '+':
        case '=':
          handlers.zoomIn()
          return
        case '-':
        case '_':
          handlers.zoomOut()
          return
        case '0':
          event.preventDefault()
          handlers.fit()
          return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers])
}
