import { useEffect } from 'react'

import { translateAnnotation } from '@/core/annotationEdits'
import { useDatasetStore } from '@/store/datasetStore'
import { useUiStore } from '@/store/uiStore'

export interface EditorShortcutHandlers {
  zoomIn: () => void
  zoomOut: () => void
  fit: () => void
  navigate: (delta: number) => void
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

      switch (event.key) {
        case 'v':
          ui.setTool('select')
          return
        case 'b':
          ui.setTool('bbox')
          return
        case 'p':
          ui.setTool('polygon')
          return
        case 'k':
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
          const index = state.selectedAnnotationIndex
          if (index !== null) {
            event.preventDefault()
            const step = event.shiftKey ? 10 : 1
            const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
            const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
            state.updateAnnotation(
              index,
              (annotation) => translateAnnotation(annotation, dx, dy),
              'nudge',
            )
          } else if (event.key === 'ArrowLeft') {
            handlers.navigate(-1)
          } else if (event.key === 'ArrowRight') {
            handlers.navigate(1)
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
