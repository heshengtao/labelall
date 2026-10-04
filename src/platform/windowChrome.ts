import { getCurrentWindow } from '@tauri-apps/api/window'
import type { MouseEvent as ReactMouseEvent } from 'react'

import { detectRuntimeEnv } from './detect-env'

export type DesktopPlatform = 'macos' | 'windows' | 'linux'

function matchPlatform(): DesktopPlatform | null {
  if (typeof navigator === 'undefined') {
    return null
  }
  const ua = navigator.userAgent
  if (/Mac|Macintosh/i.test(ua)) {
    return 'macos'
  }
  if (/Windows|Win/i.test(ua)) {
    return 'windows'
  }
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) {
    return 'linux'
  }
  return null
}

/** The desktop platform behind the Tauri shell, or `null` in the browser build. */
export function detectDesktopPlatform(): DesktopPlatform | null {
  return detectRuntimeEnv() === 'tauri' ? matchPlatform() : null
}

/** macOS keeps its native traffic lights, which float over the app's top bar. */
export function isMacDesktop(): boolean {
  return detectDesktopPlatform() === 'macos'
}

/** Windows and Linux are undecorated, so the app draws its own window controls. */
export function hasCustomWindowControls(): boolean {
  const platform = detectDesktopPlatform()
  return platform === 'windows' || platform === 'linux'
}

/**
 * Drag handler for the app's top bar. The bar doubles as the window title bar,
 * so a press that does not land on an interactive control moves the window and
 * a double press toggles maximise.
 */
export function handleTopBarPointerDown(event: ReactMouseEvent<HTMLElement>): void {
  if (detectRuntimeEnv() !== 'tauri' || event.buttons !== 1) {
    return
  }
  const target = event.target as HTMLElement
  if (target.closest('button, a, input, select, textarea, [role="button"]')) {
    return
  }
  const appWindow = getCurrentWindow()
  if (event.detail === 2) {
    void appWindow.toggleMaximize()
  } else {
    void appWindow.startDragging()
  }
}

export function minimizeWindow(): void {
  void getCurrentWindow().minimize()
}

export function toggleMaximizeWindow(): void {
  void getCurrentWindow().toggleMaximize()
}

export function closeWindow(): void {
  void getCurrentWindow().close()
}

export function isWindowMaximized(): Promise<boolean> {
  return getCurrentWindow().isMaximized()
}

/** Subscribe to resize events; the returned function removes the listener. */
export function onWindowResized(listener: () => void): Promise<() => void> {
  return getCurrentWindow().onResized(listener)
}
