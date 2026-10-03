/**
 * Dataset format detection.
 *
 * Detection is intentionally cheap-first: file names and directory structure
 * give most of the signal, and only small files are peeked at to confirm. The
 * result is a ranked list so the UI can let the user pick when it is ambiguous.
 */

import { parse as parseYaml } from 'yaml'

import type { SourceFormat } from '../model'
import { fileDirname, fileExtension } from '../path'

/** A file or directory listed relative to the dataset root (using `/`). */
export interface DetectedFile {
  path: string
  isDir: boolean
  size: number
}

export interface DetectContext {
  files: DetectedFile[]
  /** Read a text file, path relative to the dataset root. */
  readText: (relPath: string) => Promise<string>
}

export interface DetectionCandidate {
  format: SourceFormat
  /** 0–1; higher wins. */
  confidence: number
  /** Human-readable explanation, shown in the open-dataset wizard. */
  reason: string
}

export const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.jfif',
  '.pjpeg',
  '.png',
  '.bmp',
  '.webp',
  '.tif',
  '.tiff',
  '.gif',
])

/**
 * Upper bound on the size of a file we are willing to read while probing.
 * Large COCO files are parsed later, on explicit confirmation, not during
 * detection.
 */
const MAX_PROBE_BYTES = 32 * 1024 * 1024

function isImage(path: string): boolean {
  return IMAGE_EXTENSIONS.has(fileExtension(path))
}

interface JsonShape {
  isCoco: boolean
  isLabelme: boolean
}

async function probeJson(ctx: DetectContext, path: string): Promise<JsonShape> {
  const shape: JsonShape = { isCoco: false, isLabelme: false }
  try {
    const text = await ctx.readText(path)
    const data: unknown = JSON.parse(text)
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      shape.isCoco =
        Array.isArray(record.images) &&
        Array.isArray(record.annotations) &&
        Array.isArray(record.categories)
      shape.isLabelme =
        Array.isArray(record.shapes) && typeof record.imagePath === 'string' && !shape.isCoco
    }
  } catch {
    // Unreadable or invalid JSON simply yields no signal.
  }
  return shape
}

async function probeYamlNames(
  ctx: DetectContext,
  path: string,
): Promise<{ hasNames: boolean; hasKeypointShape: boolean }> {
  try {
    const data = parseYaml(await ctx.readText(path)) as Record<string, unknown> | null
    if (!data || typeof data !== 'object') {
      return { hasNames: false, hasKeypointShape: false }
    }
    return {
      hasNames: 'names' in data && data.names != null,
      hasKeypointShape: 'kpt_shape' in data && data.kpt_shape != null,
    }
  } catch {
    return { hasNames: false, hasKeypointShape: false }
  }
}

/**
 * Detect the dataset format(s) present in a directory listing.
 * Returns candidates sorted by descending confidence.
 */
export async function detectFormat(ctx: DetectContext): Promise<DetectionCandidate[]> {
  const files = ctx.files.filter((entry) => !entry.isDir)
  const dirs = new Set(ctx.files.filter((entry) => entry.isDir).map((entry) => entry.path))
  const images = files.filter((entry) => isImage(entry.path))

  const jsonFiles = files.filter((entry) => fileExtension(entry.path) === '.json')
  const xmlFiles = files.filter((entry) => fileExtension(entry.path) === '.xml')
  const yamlFiles = files.filter((entry) => ['.yaml', '.yml'].includes(fileExtension(entry.path)))
  const labelTxtFiles = files.filter(
    (entry) => fileExtension(entry.path) === '.txt' && /(^|\/)labels\//.test(entry.path),
  )

  const candidates: DetectionCandidate[] = []
  const probeable = jsonFiles.filter((entry) => entry.size <= MAX_PROBE_BYTES)

  // ---- COCO ----------------------------------------------------------------
  const cocoProbes = await Promise.all(
    probeable
      .filter(
        (entry) => /(^|\/)annotations\//.test(entry.path) || fileExtension(entry.path) === '.json',
      )
      .slice(0, 3)
      .map(async (entry) => ({ entry, shape: await probeJson(ctx, entry.path) })),
  )
  const cocoHit = cocoProbes.find((probe) => probe.shape.isCoco)
  if (cocoHit) {
    candidates.push({
      format: 'coco',
      confidence: 1,
      reason: `COCO annotations found in ${cocoHit.entry.path}`,
    })
  } else if (jsonFiles.length === 1 && images.length > 0 && xmlFiles.length === 0) {
    candidates.push({
      format: 'coco',
      confidence: 0.5,
      reason: 'A single JSON file alongside images (unverified COCO layout)',
    })
  }

  // ---- Pascal VOC ----------------------------------------------------------
  const hasVocDirs = dirs.has('Annotations') && dirs.has('JPEGImages')
  const annotationXmls = xmlFiles.filter((entry) => /(^|\/)Annotations\//.test(entry.path))
  if (hasVocDirs && annotationXmls.length > 0) {
    candidates.push({
      format: 'voc',
      confidence: 1,
      reason: `Pascal VOC layout (Annotations/ + JPEGImages/, ${annotationXmls.length} XML files)`,
    })
  } else if (annotationXmls.length > 0 && images.length > 0) {
    candidates.push({
      format: 'voc',
      confidence: 0.6,
      reason: `${annotationXmls.length} XML annotations alongside images`,
    })
  }

  // ---- YOLO ----------------------------------------------------------------
  const hasImagesDir = dirs.has('images') || [...dirs].some((dir) => dir.endsWith('/images'))
  const hasLabelsDir = dirs.has('labels') || [...dirs].some((dir) => dir.endsWith('/labels'))
  const yoloProbes = await Promise.all(
    yamlFiles
      .filter((entry) => entry.size <= MAX_PROBE_BYTES)
      .slice(0, 3)
      .map(async (entry) => ({ entry, probe: await probeYamlNames(ctx, entry.path) })),
  )
  const yoloYaml = yoloProbes.find((probe) => probe.probe.hasNames)

  if (hasImagesDir && hasLabelsDir) {
    const isPose = yoloYaml?.probe.hasKeypointShape ?? false
    candidates.push({
      format: isPose ? 'yolo-pose' : 'yolo',
      confidence: yoloYaml ? 1 : 0.7,
      reason: yoloYaml
        ? `Ultralytics YOLO layout with class names from ${yoloYaml.entry.path}`
        : 'Parallel images/ and labels/ directories',
    })
  } else if (labelTxtFiles.length > 0 && images.length > 0) {
    candidates.push({
      format: 'yolo',
      confidence: 0.5,
      reason: 'Label .txt files under labels/ alongside images',
    })
  }

  // ---- labelme -------------------------------------------------------------
  const labelmeProbe = await Promise.all(
    probeable
      .filter((entry) => !/(^|\/)annotations\//.test(entry.path))
      .slice(0, 3)
      .map(async (entry) => ({ entry, shape: await probeJson(ctx, entry.path) })),
  )
  const labelmeHit = labelmeProbe.find((probe) => probe.shape.isLabelme)
  if (labelmeHit && images.length > 0) {
    candidates.push({
      format: 'labelme',
      confidence: 0.9,
      reason: `labelme JSON found (${labelmeHit.entry.path})`,
    })
  }

  // ---- Classification / ImageFolder ---------------------------------------
  const hasAnnotationFiles =
    jsonFiles.length > 0 || xmlFiles.length > 0 || yamlFiles.length > 0 || labelTxtFiles.length > 0
  if (!hasAnnotationFiles && images.length > 0) {
    const parentDirs = new Set(images.map((entry) => fileDirname(entry.path)))
    // A flat folder of images is a single implicit class; nested folders look
    // like one directory per class.
    const looksLikeClasses = parentDirs.size > 1 && !(parentDirs.size === 1 && parentDirs.has(''))
    candidates.push({
      format: 'imagefolder',
      confidence: looksLikeClasses ? 0.8 : 0.4,
      reason: looksLikeClasses
        ? `Images grouped into ${parentDirs.size} directories (one per class)`
        : 'Images with no annotation files',
    })
  }

  return candidates.sort((a, b) => b.confidence - a.confidence)
}
