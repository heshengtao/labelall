import type { DatasetModel } from '../model'

/** Everything a reader needs besides the files themselves. */
export interface ReadContext {
  /** Dataset root, or a display name for browser-loaded folders. */
  root: string
  /** Read a text file, path relative to the dataset root. */
  readText: (relPath: string) => Promise<string>
}

/**
 * Readers never throw for recoverable problems — they collect warnings so the UI
 * can show what was skipped or interpreted loosely.
 */
export interface ReadResult {
  dataset: DatasetModel
  warnings: string[]
}

/** A file a writer wants to create, path relative to the output root. */
export interface OutputFile {
  path: string
  contents: string
}

export interface WriteResult {
  files: OutputFile[]
  warnings: string[]
}
