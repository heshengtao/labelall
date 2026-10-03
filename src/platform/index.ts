import { detectRuntimeEnv } from './detect-env'
import { createTauriSource } from './tauri'
import type { DatasetSource } from './types'
import { createWebSource } from './web'

let cached: DatasetSource | null = null

/**
 * The single `DatasetSource` for the current runtime. UI code imports this and
 * nothing else from the platform layer.
 */
export function getDatasetSource(): DatasetSource {
  if (!cached) {
    cached = detectRuntimeEnv() === 'tauri' ? createTauriSource() : createWebSource()
  }
  return cached
}

export type { DatasetHandle, DatasetSource, TextFile } from './types'
