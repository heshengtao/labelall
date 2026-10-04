import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

import { FILE_READ_CONCURRENCY, mapLimit } from '@/core/concurrency'
import type { DetectedFile } from '@/core/formats/detect'
import { EXPORT_DIR, type DatasetHandle, type DatasetSource, type TextFile } from './types'

interface ScanEntry {
  relPath: string
  isDir: boolean
  size: number
}

interface DatasetScan {
  root: string
  entries: ScanEntry[]
  totalFiles: number
}

/**
 * Join the dataset root with a relative POSIX path. Forward slashes are valid on
 * every platform Tauri targets, including Windows, so no separator juggling is
 * needed.
 */
function joinRoot(root: string, relPath: string): string {
  return `${root.replace(/[\\/]+$/, '')}/${relPath}`
}

function basename(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).pop() ?? path
}

/** Split a path into its parent directory and the separator it uses. */
function splitParent(path: string): { parent: string; separator: string } {
  const separator = path.includes('\\') ? '\\' : '/'
  const trimmed = path.replace(/[\\/]+$/, '')
  const slash = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  const parent = slash < 0 ? '' : slash === 0 ? separator : trimmed.slice(0, slash)
  return { parent, separator }
}

export function createTauriSource(): DatasetSource {
  return {
    kind: 'tauri',
    canWrite: true,

    async pickDataset(): Promise<DatasetHandle | null> {
      const selected = await open({ directory: true, multiple: false })
      if (typeof selected !== 'string') {
        return null
      }
      return { id: selected, root: selected, displayName: basename(selected) }
    },

    async scan(handle): Promise<DetectedFile[]> {
      const result = await invoke<DatasetScan>('scan_dataset', { root: handle.root })
      return result.entries.map((entry) => ({
        path: entry.relPath,
        isDir: entry.isDir,
        size: entry.size,
      }))
    },

    readText(handle, relPath) {
      return invoke<string>('read_text_file', { path: joinRoot(handle.root, relPath) })
    },

    async writeTexts(handle, files: TextFile[]): Promise<void> {
      await invoke('write_text_files', {
        files: files.map((file) => ({
          path: joinRoot(handle.root, file.path),
          contents: file.contents,
        })),
      })
    },

    exportTarget(handle, format) {
      const { parent, separator } = splitParent(handle.root)
      return {
        // `..` keeps the contract dataset-relative; Rust resolves it against the root.
        prefix: `../${EXPORT_DIR}/${format}`,
        displayPath: [parent, EXPORT_DIR, format].filter(Boolean).join(separator),
      }
    },

    async copyImages(handle, relPaths, destPrefix, onProgress) {
      let copied = 0
      await mapLimit(relPaths, FILE_READ_CONCURRENCY, async (relPath) => {
        await invoke('copy_file', {
          from: joinRoot(handle.root, relPath),
          to: joinRoot(handle.root, `${destPrefix}/${relPath}`),
        })
        copied += 1
        onProgress?.(copied / Math.max(1, relPaths.length))
      })
    },

    async getImageUrl(handle, relPath) {
      return convertFileSrc(joinRoot(handle.root, relPath))
    },

    async imageSize(handle, relPath) {
      try {
        const dims = await invoke<{ width: number; height: number }>('image_dimensions', {
          path: joinRoot(handle.root, relPath),
        })
        return { width: dims.width, height: dims.height }
      } catch {
        return null
      }
    },
  }
}
