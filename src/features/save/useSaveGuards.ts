import { useEffect } from 'react'

import { detectRuntimeEnv } from '@/platform/detect-env'
import { destroyWindow, onCloseRequested } from '@/platform/windowChrome'
import { useDatasetStore } from '@/store/datasetStore'
import { useSaveStore } from '@/store/saveStore'

import { saveCurrentDataset } from './saveDataset'

/** Ctrl/Cmd+S saves the open dataset from anywhere in the app. */
export function useSaveShortcut(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') {
        return
      }
      event.preventDefault()
      void saveCurrentDataset()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

/**
 * Ask to save before an action that would discard the current edits. Resolves
 * `true` when it is safe to continue (saved or discarded).
 */
export async function guardUnsavedChanges(): Promise<boolean> {
  if (!useDatasetStore.getState().dirty) {
    return true
  }
  return useSaveStore.getState().confirmUnsaved()
}

/**
 * Intercept the ways the app can close with unsaved edits: the native window
 * close on desktop, and a page unload on the web. Both then route through the
 * same prompt, which can save before continuing.
 */
export function useCloseGuard(): void {
  useEffect(() => {
    if (detectRuntimeEnv() !== 'tauri') {
      return
    }
    let unlisten: (() => void) | undefined
    void onCloseRequested((event) => {
      if (!useDatasetStore.getState().dirty) {
        return
      }
      event.preventDefault()
      void guardUnsavedChanges().then((proceed) => {
        if (proceed) {
          void destroyWindow()
        }
      })
    }).then(
      (stop) => {
        unlisten = stop
      },
      () => {
        // If the listener cannot be registered the window simply closes normally;
        // there is nothing useful to do here.
      },
    )
    return () => unlisten?.()
  }, [])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      if (!useDatasetStore.getState().dirty) {
        return
      }
      event.preventDefault()
      // Legacy browsers only show the prompt when returnValue is set.
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])
}
