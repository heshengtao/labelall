import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

import type { DetectedFile } from '@/core/formats/detect'
import type { DatasetHandle, DatasetSource, TextFile } from './types'

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

    async getImageUrl(handle, relPath) {
      return convertFileSrc(joinRoot(handle.root, relPath))
    },
  }
}
