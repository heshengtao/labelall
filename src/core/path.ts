/**
 * Minimal POSIX-style path helpers.
 *
 * Dataset-relative paths always use `/` regardless of the host OS, so we use a
 * tiny purpose-built implementation rather than `node:path` — this keeps
 * `src/core` free of any Node/DOM/Tauri dependency so it runs unchanged in the
 * browser, in a worker, and in tests.
 */

/** Join path segments, dropping empties and duplicate separators. */
export function joinPath(...parts: string[]): string {
  const joined = parts
    .filter((part) => part.length > 0)
    .join('/')
    .replace(/\/{2,}/g, '/')
  return joined.length > 1 ? joined.replace(/\/$/, '') : joined
}

export function fileBasename(path: string): string {
  const slash = path.lastIndexOf('/')
  return slash === -1 ? path : path.slice(slash + 1)
}

export function fileDirname(path: string): string {
  const slash = path.lastIndexOf('/')
  return slash === -1 ? '' : path.slice(0, slash)
}

/** Extension including the leading dot, lower-cased. `''` when there is none. */
export function fileExtension(path: string): string {
  const slash = path.lastIndexOf('/')
  const dot = path.lastIndexOf('.')
  return dot > slash ? path.slice(dot).toLowerCase() : ''
}

export function fileStem(path: string): string {
  const base = fileBasename(path)
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(0, dot) : base
}

export function stripExtension(path: string): string {
  const ext = fileExtension(path)
  return ext ? path.slice(0, -ext.length) : path
}

export function replaceExtension(path: string, extension: string): string {
  return `${stripExtension(path)}${extension}`
}

/**
 * Ultralytics resolves a label file by replacing the last `/images/` segment of
 * the image path with `/labels/`. Mirroring that rule is what lets us find the
 * labels for the varied directory layouts found in the wild.
 */
export function imagesPathToLabelsPath(imagePath: string, labelDir = 'labels'): string {
  const marker = '/images/'
  const index = imagePath.lastIndexOf(marker)
  if (index !== -1) {
    return replaceExtension(
      `${imagePath.slice(0, index)}/${labelDir}/${imagePath.slice(index + marker.length)}`,
      '.txt',
    )
  }
  // The images directory can also sit at the dataset root, where there is no
  // leading separator to match.
  if (imagePath.startsWith('images/')) {
    return replaceExtension(`${labelDir}/${imagePath.slice('images/'.length)}`, '.txt')
  }
  return replaceExtension(joinPath(labelDir, fileBasename(imagePath)), '.txt')
}
