/**
 * Dataset format detection.
 *
 * Detection is intentionally cheap-first: file names and directory structure
 * give most of the signal, and only small files are peeked at to confirm. The
 * result is a ranked list so the UI can let the user pick when it is ambiguous.
 */

import { parse as parseYaml } from 'yaml'

import type { VocBoxPolicy } from '../geometry'
import type { SourceFormat } from '../model'
import { fileDirname, fileExtension, fileStem } from '../path'
import type { CocoSource } from './coco'

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

/**
 * Format-specific hints a reader needs, discovered during detection so the
 * reader does not have to search the listing again.
 */
export interface DatasetParams {
  /** COCO: the annotation JSON to read. */
  annotationPath?: string
  /**
   * COCO: several split annotation files (e.g. `instances_train.json` and
   * `instances_val.json`) that should be merged into one dataset. Takes
   * precedence over `annotationPath` when present.
   */
  cocoSources?: CocoSource[]
  /** labelme: every per-image JSON that should be merged into one dataset. */
  annotationPaths?: string[]
  /** Directory that image paths in the annotation file are relative to. */
  imageDir?: string
  /** Split inferred from the file or directory name (train/val/test). */
  split?: string
  /** VOC: how `xmax`/`ymax` are interpreted. */
  boxPolicy?: VocBoxPolicy
}

export interface DetectionCandidate {
  format: SourceFormat
  /** 0–1; higher wins. */
  confidence: number
  /** Human-readable explanation, shown in the open-dataset wizard. */
  reason: string
  /** Parameters to hand to the reader if this candidate is chosen. */
  params?: DatasetParams
}

/** Collapse the many spellings seen in the wild onto train/val/test. */
export function inferSplit(path: string): string | undefined {
  const match = /(?:^|[^a-z])(train|training|val|valid|validation|test|testing)(?:[^a-z]|$)/i.exec(
    path,
  )
  if (!match) {
    return undefined
  }
  const raw = match[1].toLowerCase()
  if (raw === 'training') return 'train'
  if (raw === 'valid' || raw === 'validation') return 'val'
  if (raw === 'testing') return 'test'
  return raw
}

/**
 * Find where a COCO annotation file's images live. The two layouts seen in the
 * wild are `root/images/*` and `root/<split>/*` (e.g. train2017/val2017).
 */
function inferCocoImageDir(
  annotationPath: string,
  dirs: Set<string>,
  images: DetectedFile[],
): string | undefined {
  if (dirs.has('images') && images.some((entry) => entry.path.startsWith('images/'))) {
    return 'images'
  }
  const split = inferSplit(annotationPath)
  if (split && dirs.has(split) && images.some((entry) => entry.path.startsWith(`${split}/`))) {
    return split
  }
  return undefined
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

/** Whether an XML file has an image with the same file stem in the same folder. */
function hasSiblingImage(xmlPath: string, stemsByDir: Map<string, Set<string>>): boolean {
  return stemsByDir.get(fileDirname(xmlPath))?.has(fileStem(xmlPath)) ?? false
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
      // `categories` is optional in practice; the reader tolerates its absence.
      shape.isCoco = Array.isArray(record.images) && Array.isArray(record.annotations)
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
): Promise<{ hasNames: boolean; hasKeypointShape: boolean; hasSplitSets: boolean }> {
  const none = { hasNames: false, hasKeypointShape: false, hasSplitSets: false }
  try {
    const data = parseYaml(await ctx.readText(path)) as Record<string, unknown> | null
    if (!data || typeof data !== 'object') {
      return none
    }
    // Ultralytics keeps `names` at the top level; MindYOLO nests everything
    // under `data:` and describes splits with `*_set` list files.
    const block =
      data.data && typeof data.data === 'object' ? (data.data as Record<string, unknown>) : data
    return {
      hasNames: 'names' in block && block.names != null,
      hasKeypointShape: 'kpt_shape' in block && block.kpt_shape != null,
      hasSplitSets: (['train_set', 'val_set', 'test_set'] as const).some(
        (key) => typeof block[key] === 'string',
      ),
    }
  } catch {
    return none
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
  const csvFiles = files.filter((entry) => fileExtension(entry.path) === '.csv')

  const candidates: DetectionCandidate[] = []
  const probeable = jsonFiles.filter((entry) => entry.size <= MAX_PROBE_BYTES)

  // ---- COCO ----------------------------------------------------------------
  const cocoProbes = await Promise.all(
    probeable
      .filter(
        (entry) => /(^|\/)annotations\//.test(entry.path) || fileExtension(entry.path) === '.json',
      )
      .slice(0, 6)
      .map(async (entry) => ({ entry, shape: await probeJson(ctx, entry.path) })),
  )
  const cocoHits = cocoProbes.filter((probe) => probe.shape.isCoco)
  if (cocoHits.length === 1) {
    const hit = cocoHits[0]
    candidates.push({
      format: 'coco',
      confidence: 1,
      reason: `COCO annotations found in ${hit.entry.path}`,
      params: {
        annotationPath: hit.entry.path,
        imageDir: inferCocoImageDir(hit.entry.path, dirs, images),
        split: inferSplit(hit.entry.path),
      },
    })
  } else if (cocoHits.length > 1) {
    // A dataset split across `instances_train.json`, `instances_val.json`, …
    // loads as one dataset, each file contributing its own split.
    const sources: CocoSource[] = cocoHits.map((hit) => ({
      annotationPath: hit.entry.path,
      imageDir: inferCocoImageDir(hit.entry.path, dirs, images),
      split: inferSplit(hit.entry.path),
    }))
    const labels = sources.map((source) => source.split ?? source.annotationPath).join(', ')
    candidates.push({
      format: 'coco',
      confidence: 1,
      reason: `COCO annotations found in ${sources.length} files (${labels})`,
      params: { cocoSources: sources },
    })
  }
  if (
    cocoHits.length === 0 &&
    jsonFiles.length === 1 &&
    images.length > 0 &&
    xmlFiles.length === 0
  ) {
    candidates.push({
      format: 'coco',
      confidence: 0.5,
      reason: 'A single JSON file alongside images (unverified COCO layout)',
      params: { annotationPath: jsonFiles[0].path, imageDir: '' },
    })
  }

  // ---- Pascal VOC ----------------------------------------------------------
  // Build a per-folder index of image stems so we can tell whether an XML file
  // sits next to its image — the layout most tools actually produce, and one
  // that often also groups images by class.
  const imageStemsByDir = new Map<string, Set<string>>()
  for (const image of images) {
    const dir = fileDirname(image.path)
    const stems = imageStemsByDir.get(dir) ?? new Set<string>()
    stems.add(fileStem(image.path))
    imageStemsByDir.set(dir, stems)
  }

  const hasVocDirs = dirs.has('Annotations') && dirs.has('JPEGImages')
  const annotationXmls = xmlFiles.filter((entry) => /(^|\/)Annotations\//.test(entry.path))
  const pairedXmls = xmlFiles.filter((entry) => hasSiblingImage(entry.path, imageStemsByDir))

  if (hasVocDirs && annotationXmls.length > 0) {
    candidates.push({
      format: 'voc',
      confidence: 1,
      reason: `Pascal VOC layout (Annotations/ + JPEGImages/, ${annotationXmls.length} XML files)`,
    })
  } else if (pairedXmls.length > 0) {
    candidates.push({
      format: 'voc',
      confidence: 0.9,
      reason: `${pairedXmls.length} XML annotation(s) sitting next to their images`,
    })
  } else if (xmlFiles.length > 0 && images.length > 0) {
    candidates.push({
      format: 'voc',
      confidence: 0.5,
      reason: `${xmlFiles.length} XML files alongside images`,
    })
  }

  // ---- YOLO ----------------------------------------------------------------
  const hasImagesDir = dirs.has('images') || [...dirs].some((dir) => dir.endsWith('/images'))
  const hasLabelsDir = dirs.has('labels') || [...dirs].some((dir) => dir.endsWith('/labels'))
  // A .txt next to an image with the same stem is a YOLO label even without a
  // canonical images/ + labels/ pair.
  const pairedTxts = files.filter(
    (entry) => fileExtension(entry.path) === '.txt' && hasSiblingImage(entry.path, imageStemsByDir),
  )
  const yoloProbes = await Promise.all(
    yamlFiles
      .filter((entry) => entry.size <= MAX_PROBE_BYTES)
      .slice(0, 3)
      .map(async (entry) => ({ entry, probe: await probeYamlNames(ctx, entry.path) })),
  )
  const mindyoloYaml = yoloProbes.find((probe) => probe.probe.hasSplitSets)
  const yoloYaml = yoloProbes.find((probe) => probe.probe.hasNames)

  if (mindyoloYaml) {
    candidates.push({
      format: 'mindyolo',
      confidence: 1,
      reason: `MindYOLO split list files found in ${mindyoloYaml.entry.path}`,
    })
  } else if (hasImagesDir && hasLabelsDir) {
    const isPose = yoloYaml?.probe.hasKeypointShape ?? false
    candidates.push({
      format: isPose ? 'yolo-pose' : 'yolo',
      confidence: yoloYaml ? 1 : 0.7,
      reason: yoloYaml
        ? `Ultralytics YOLO layout with class names from ${yoloYaml.entry.path}`
        : 'Parallel images/ and labels/ directories',
    })
  } else if (pairedTxts.length > 0 && images.length > 0) {
    candidates.push({
      format: 'yolo',
      confidence: 0.6,
      reason: `${pairedTxts.length} label .txt file(s) next to their images`,
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
    // labelme writes one JSON per image, so a whole dataset is every JSON that
    // does not live in a COCO-style annotations/ directory. Files that turn out
    // not to be labelme are skipped (with a warning) by the reader.
    const annotationPaths = probeable
      .filter((entry) => !/(^|\/)annotations\//.test(entry.path))
      .map((entry) => entry.path)
    candidates.push({
      format: 'labelme',
      confidence: 0.9,
      reason: `labelme JSON found (${labelmeHit.entry.path})`,
      params: { annotationPaths },
    })
  }

  // ---- CSV -----------------------------------------------------------------
  const csvProbes = await Promise.all(
    csvFiles
      .filter((entry) => entry.size <= MAX_PROBE_BYTES)
      .slice(0, 3)
      .map(async (entry) => {
        try {
          const header = (await ctx.readText(entry.path)).slice(0, 4096).split(/\r?\n/, 1)[0] ?? ''
          const columns = header
            .split(',')
            .map((column) => column.trim().replace(/^"|"$/g, '').toLowerCase())
          return {
            entry,
            hasImage: columns.includes('image') || columns.includes('filename'),
          }
        } catch {
          return { entry, hasImage: false }
        }
      }),
  )
  const csvHit = csvProbes.find((probe) => probe.hasImage)
  if (csvHit) {
    candidates.push({
      format: 'csv',
      confidence: 0.9,
      reason: `CSV annotations found in ${csvHit.entry.path}`,
      params: { annotationPath: csvHit.entry.path },
    })
  }

  // ---- Classification / ImageFolder ---------------------------------------
  const hasAnnotationFiles =
    jsonFiles.length > 0 ||
    xmlFiles.length > 0 ||
    yamlFiles.length > 0 ||
    labelTxtFiles.length > 0 ||
    csvFiles.length > 0
  const parentDirs = new Set(images.map((entry) => fileDirname(entry.path)))
  // A flat folder of images is a single implicit class; nested folders look
  // like one directory per class.
  const looksLikeClasses = parentDirs.size > 1 && !(parentDirs.size === 1 && parentDirs.has(''))
  // With annotation files present, class folders are still a valid *alternative*
  // reading: the folder name becomes an image-level label and the geometry is
  // ignored. Offer it at a lower confidence so the user can pick.
  if (!hasAnnotationFiles && images.length > 0) {
    candidates.push({
      format: 'imagefolder',
      confidence: looksLikeClasses ? 0.8 : 0.4,
      reason: looksLikeClasses
        ? `Images grouped into ${parentDirs.size} directories (one per class)`
        : 'Images with no annotation files',
    })
  } else if (pairedXmls.length > 0 && looksLikeClasses) {
    candidates.push({
      format: 'imagefolder',
      confidence: 0.5,
      reason: `Class folders detected (${parentDirs.size}); XML annotations ignored`,
    })
  }

  return candidates.sort((a, b) => b.confidence - a.confidence)
}
