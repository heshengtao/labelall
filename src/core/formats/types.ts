import type { DatasetModel } from '../model'

/** Everything a reader needs besides the files themselves. */
export interface ReadContext {
  /** Dataset root, or a display name for browser-loaded folders. */
  root: string
  /** Read a text file, path relative to the dataset root. */
  readText: (relPath: string) => Promise<string>
  /**
   * Image dimensions, for formats that store normalised coordinates (YOLO).
   * Optional because formats that carry their own sizes (COCO, VOC) never call it.
   */
  imageSize?: (relPath: string) => Promise<{ width: number; height: number } | null>
  /**
   * 0–1 progress of the read, so the UI progress bar can advance while a large
   * multi-file dataset is being parsed.
   */
  onProgress?: (value: number) => void
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

/**
 * A new location for an image, when a format requires renaming or relocating it
 * (MindYOLO, for instance, only accepts numeric file names).
 */
export interface ImageRelocation {
  /** Source path, dataset-relative, as read. */
  from: string
  /** Destination path relative to the export prefix. */
  to: string
}

export interface WriteResult {
  files: OutputFile[]
  warnings: string[]
  /**
   * Images the format writes under a new name or directory. Absent when the
   * writer keeps every image at its original path, which is the common case.
   */
  images?: ImageRelocation[]
}
