import type { DetectedFile } from '@/core/formats/detect'

/** A text file a writer wants to create, path relative to the dataset root. */
export interface TextFile {
  path: string
  contents: string
}

export interface DatasetHandle {
  /** Stable id for the opened folder (absolute path on desktop, synthetic on web). */
  id: string
  /** Absolute folder path on desktop; empty on web. */
  root: string
  /** Name shown in the UI. */
  displayName: string
}

/**
 * Everything the UI needs from the host environment.
 *
 * The desktop (`tauri`) and web (`web`) implementations are interchangeable, so
 * no UI code has to know which one it is running on — and no UI module may
 * import `@tauri-apps/*` directly.
 */
export interface DatasetSource {
  readonly kind: 'tauri' | 'web'
  /** Whether annotations can be written back to the source at all. */
  readonly canWrite: boolean
  /** Native folder picker; resolves to null when the user cancels. */
  pickDataset(): Promise<DatasetHandle | null>
  /** List every entry below the handle, as relative POSIX paths. */
  scan(handle: DatasetHandle): Promise<DetectedFile[]>
  /** Read a text file, path relative to the dataset root. */
  readText(handle: DatasetHandle, relPath: string): Promise<string>
  /** Write several text files at once. Throws when `canWrite` is false. */
  writeTexts(handle: DatasetHandle, files: TextFile[]): Promise<void>
  /** Resolve a URL the UI can put in an `<img src>`. */
  getImageUrl(handle: DatasetHandle, relPath: string): Promise<string>
}
