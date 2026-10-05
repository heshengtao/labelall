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

/** Name of the folder exports are collected into, next to the dataset. */
export const EXPORT_DIR = 'LabelAll_export'

/** A downscaled image the UI can put in an `<img src>`. */
export interface Thumbnail {
  url: string
  /** Frees the underlying resource when the thumbnail is evicted from the cache. */
  revoke?: () => void
}

export interface ExportTarget {
  /**
   * Dataset-relative prefix exported files are written under. May start with
   * `..` on desktop, where the target sits outside the dataset root.
   */
  prefix: string
  /** Absolute, copyable directory shown in the UI. */
  displayPath: string
}

/** One image to copy: `from` is where it is read, `to` is where it is written. */
export interface ImageCopy {
  /** Source path, dataset-relative. */
  from: string
  /** Destination path relative to the copy's `destPrefix`. */
  to: string
}

/**
 * Write access to an open dataset, mirroring the File System Access API's
 * permission states.
 *
 * - `granted`     — writes are allowed
 * - `prompt` / `denied` — the browser can still be asked (a user gesture shows
 *   its permission prompt); desktop never reports these
 * - `unsupported` — the host has no writable API at all, so there is nothing to
 *   grant (a browser without the File System Access API)
 */
export type WritePermission = 'granted' | 'prompt' | 'denied' | 'unsupported'

/**
 * Everything the UI needs from the host environment.
 *
 * The desktop (`tauri`) and web (`web`) implementations are interchangeable, so
 * no UI code has to know which one it is running on — and no UI module may
 * import `@tauri-apps/*` directly.
 */
export interface DatasetSource {
  readonly kind: 'tauri' | 'web'
  /** Whether the host can write to a dataset at all (the desktop build always can). */
  readonly canWrite: boolean
  /** Current write permission of an open handle. */
  queryWritePermission(handle: DatasetHandle): Promise<WritePermission>
  /**
   * Ask the host for write access. Must be called from a user gesture — the
   * browser only shows its permission prompt then. Resolves whether it was
   * granted.
   */
  requestWritePermission(handle: DatasetHandle): Promise<boolean>
  /** Native folder picker; resolves to null when the user cancels. */
  pickDataset(): Promise<DatasetHandle | null>
  /** List every entry below the handle, as relative POSIX paths. */
  scan(handle: DatasetHandle): Promise<DetectedFile[]>
  /** Read a text file, path relative to the dataset root. */
  readText(handle: DatasetHandle, relPath: string): Promise<string>
  /** Write several text files at once. Throws when `canWrite` is false. */
  writeTexts(handle: DatasetHandle, files: TextFile[]): Promise<void>
  /**
   * Where a format's export is written, for both the writer and the UI.
   *
   * `stamp` is a timestamp that becomes a folder segment, so repeated exports
   * land in separate folders instead of overwriting one another.
   */
  exportTarget(handle: DatasetHandle, format: string, stamp: string): ExportTarget
  /**
   * Copy image files into `destPrefix` (dataset-relative, possibly starting
   * with `..` on desktop), so an export can be a self-contained folder.
   *
   * Each entry maps a source path (dataset-relative, as read) to a destination
   * path relative to `destPrefix`; the two differ when an export relocates
   * images into a canonical layout. Reports 0–1 progress.
   */
  copyImages(
    handle: DatasetHandle,
    files: ImageCopy[],
    destPrefix: string,
    onProgress?: (value: number) => void,
  ): Promise<void>
  /** Resolve a URL the UI can put in an `<img src>`. */
  getImageUrl(handle: DatasetHandle, relPath: string): Promise<string>
  /**
   * Resolve a thumbnail no larger than `maxEdge` on its longest side. The
   * desktop build downscales natively so the webview never decodes an original,
   * full-resolution photo just to draw a small tile.
   */
  thumbnail(handle: DatasetHandle, relPath: string, maxEdge: number): Promise<Thumbnail>
  /** Image dimensions, or null when they cannot be read. */
  imageSize(
    handle: DatasetHandle,
    relPath: string,
  ): Promise<{ width: number; height: number } | null>
}
