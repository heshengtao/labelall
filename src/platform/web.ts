import type { DetectedFile } from '@/core/formats/detect'
import { joinPath } from '@/core/path'
import { EXPORT_DIR, type DatasetHandle, type DatasetSource, type TextFile } from './types'

// --- Minimal File System Access API typings ---------------------------------
// `showDirectoryPicker` and `createWritable` are still not in lib.dom, and we
// only need a small slice of the API, so declare just that instead of pulling in
// another dependency.
interface FsWritable {
  write(data: string): Promise<void>
  close(): Promise<void>
}
interface FsFileHandle {
  kind: 'file'
  name: string
  getFile(): Promise<File>
  createWritable(): Promise<FsWritable>
}
interface FsDirectoryHandle {
  kind: 'directory'
  name: string
  values(): AsyncIterableIterator<FsDirectoryHandle | FsFileHandle>
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FsDirectoryHandle>
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FsFileHandle>
}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FsDirectoryHandle>
  }
}

type Stored = { kind: 'fs'; dir: FsDirectoryHandle } | { kind: 'input'; files: Map<string, File> }

const stored = new Map<string, Stored>()

/** Turn a flat list of relative file paths into a listing that includes dirs. */
export function entriesFromRelativePaths(
  files: Iterable<{ path: string; size: number }>,
): DetectedFile[] {
  const entries = new Map<string, DetectedFile>()
  for (const file of files) {
    entries.set(file.path, { path: file.path, isDir: false, size: file.size })
    const segments = file.path.split('/')
    segments.pop()
    while (segments.length > 0) {
      const dir = segments.join('/')
      if (!entries.has(dir)) {
        entries.set(dir, { path: dir, isDir: true, size: 0 })
      }
      segments.pop()
    }
  }
  return [...entries.values()].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
}

function hasDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

// --- Blob URL cache ---------------------------------------------------------
// Web images are served as object URLs, which must be revoked or they leak.
// Keep a bounded LRU so browsing a large dataset stays flat in memory.
const blobUrls = new Map<string, string>()
const MAX_BLOB_URLS = 200

function blobUrlFor(key: string, file: File): string {
  const cached = blobUrls.get(key)
  if (cached) {
    return cached
  }
  const url = URL.createObjectURL(file)
  blobUrls.set(key, url)
  if (blobUrls.size > MAX_BLOB_URLS) {
    const oldest = blobUrls.keys().next().value
    if (oldest !== undefined) {
      const stale = blobUrls.get(oldest)
      if (stale) URL.revokeObjectURL(stale)
      blobUrls.delete(oldest)
    }
  }
  return url
}

function revokeAllBlobUrls(): void {
  for (const url of blobUrls.values()) {
    URL.revokeObjectURL(url)
  }
  blobUrls.clear()
}

// --- File System Access API helpers -----------------------------------------
async function resolveDirectory(
  root: FsDirectoryHandle,
  segments: string[],
  create: boolean,
): Promise<FsDirectoryHandle> {
  let current = root
  for (const segment of segments) {
    current = await current.getDirectoryHandle(segment, create ? { create: true } : undefined)
  }
  return current
}

async function readFsFile(root: FsDirectoryHandle, relPath: string): Promise<File> {
  const segments = relPath.split('/')
  const name = segments.pop()
  if (!name) {
    throw new Error(`invalid path: ${relPath}`)
  }
  const dir = await resolveDirectory(root, segments, false)
  return (await dir.getFileHandle(name)).getFile()
}

async function collectFsFiles(
  dir: FsDirectoryHandle,
  prefix: string,
  out: { path: string; size: number }[],
): Promise<void> {
  for await (const entry of dir.values()) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.kind === 'directory') {
      await collectFsFiles(entry, path, out)
    } else {
      const file = await entry.getFile()
      out.push({ path, size: file.size })
    }
  }
}

// --- Legacy fallback: <input webkitdirectory> -------------------------------
interface InputPick {
  /** Name of the folder the user picked, used as the dataset display name. */
  name: string
  /** Files keyed by their path relative to that folder. */
  files: Map<string, File>
}

function pickWithInput(): Promise<InputPick | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.setAttribute('webkitdirectory', '')
    input.style.display = 'none'

    input.addEventListener(
      'change',
      () => {
        const list = input.files ? Array.from(input.files) : []
        input.remove()
        if (list.length === 0) {
          resolve(null)
          return
        }
        const files = new Map<string, File>()
        let name = ''
        for (const file of list) {
          const segments = (file.webkitRelativePath || file.name).split('/')
          // The first segment is the picked root folder; it is dropped from the
          // relative paths but kept as the dataset's display name.
          if (!name) {
            name = segments[0] ?? ''
          }
          segments.shift()
          const path = segments.join('/')
          if (path) {
            files.set(path, file)
          }
        }
        resolve({ name, files })
      },
      { once: true },
    )

    document.body.appendChild(input)
    input.click()
    // If the user cancels, most browsers fire no event and this promise simply
    // never settles — the same as a native picker being dismissed.
  })
}

export function createWebSource(): DatasetSource {
  const canWrite = hasDirectoryPicker()

  return {
    kind: 'web',
    canWrite,

    async pickDataset(): Promise<DatasetHandle | null> {
      revokeAllBlobUrls()
      const id = crypto.randomUUID()

      if (canWrite && window.showDirectoryPicker) {
        const dir = await window.showDirectoryPicker({ mode: 'readwrite' })
        stored.set(id, { kind: 'fs', dir })
        return { id, root: '', displayName: dir.name }
      }

      const picked = await pickWithInput()
      if (!picked) {
        return null
      }
      stored.set(id, { kind: 'input', files: picked.files })
      return { id, root: '', displayName: picked.name || 'dataset' }
    },

    async scan(handle): Promise<DetectedFile[]> {
      const entry = stored.get(handle.id)
      if (!entry) {
        throw new Error('the dataset is no longer available; open it again')
      }
      if (entry.kind === 'input') {
        return entriesFromRelativePaths(
          [...entry.files].map(([path, file]) => ({ path, size: file.size })),
        )
      }
      const files: { path: string; size: number }[] = []
      await collectFsFiles(entry.dir, '', files)
      return entriesFromRelativePaths(files)
    },

    async readText(handle, relPath): Promise<string> {
      const entry = stored.get(handle.id)
      if (!entry) {
        throw new Error('the dataset is no longer available; open it again')
      }
      if (entry.kind === 'input') {
        const file = entry.files.get(relPath)
        if (!file) {
          throw new Error(`file not found: ${relPath}`)
        }
        return file.text()
      }
      return (await readFsFile(entry.dir, relPath)).text()
    },

    async writeTexts(handle, files: TextFile[]): Promise<void> {
      const entry = stored.get(handle.id)
      if (!entry) {
        throw new Error('the dataset is no longer available; open it again')
      }
      if (entry.kind === 'input') {
        throw new Error('this browser can only open datasets read-only')
      }
      for (const file of files) {
        const segments = file.path.split('/')
        const name = segments.pop()
        if (!name) continue
        const dir = await resolveDirectory(entry.dir, segments, true)
        const handleFile = await dir.getFileHandle(name, { create: true })
        const writable = await handleFile.createWritable()
        await writable.write(file.contents)
        await writable.close()
      }
    },

    exportTarget(handle, format) {
      // A browser cannot reach a sibling of the picked folder, so the export
      // nests inside it — under the same name the desktop build uses.
      const prefix = `${EXPORT_DIR}/${format}`
      return { prefix, displayPath: joinPath(handle.displayName, prefix) }
    },

    async getImageUrl(handle, relPath): Promise<string> {
      const entry = stored.get(handle.id)
      if (!entry) {
        throw new Error('the dataset is no longer available; open it again')
      }
      const file =
        entry.kind === 'input' ? entry.files.get(relPath) : await readFsFile(entry.dir, relPath)
      if (!file) {
        throw new Error(`image not found: ${relPath}`)
      }
      return blobUrlFor(`${handle.id}:${relPath}`, file)
    },

    async imageSize(handle, relPath) {
      const entry = stored.get(handle.id)
      if (!entry) {
        return null
      }
      const file =
        entry.kind === 'input' ? entry.files.get(relPath) : await readFsFile(entry.dir, relPath)
      if (!file) {
        return null
      }
      return readImageSize(file)
    },
  }
}

async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap !== 'function') {
    return null
  }
  try {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  } catch {
    return null
  }
}
