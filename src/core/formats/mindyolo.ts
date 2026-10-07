/**
 * MindYOLO reader and writer.
 *
 * MindYOLO (MindSpore) trains on YOLO-format labels but describes its dataset
 * with a `data:` config rather than Ultralytics' `train:`/`val:` block:
 *
 *   data:
 *     train_set: ./train.txt   # a text file listing image paths, one per line
 *     val_set:   ./val.txt
 *     nc: 2
 *     names: ['cat', 'dog']
 *
 * Images live under `images/<split>/` and labels mirror them under
 * `labels/<split>/`, located with the same images→labels rule YOLO uses. A
 * missing split list is tolerated — the dataset simply loads without it, which
 * is what makes a partially populated dataset (train only, say) work.
 *
 * Reading reuses the YOLO label parser; only the image list and class names
 * come from MindYOLO's own config.
 */

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

import type { DatasetModel, ImageRecord } from '../model'
import { fileBasename, fileDirname, fileExtension, fileStem, joinPath } from '../path'
import type { NamedSplit } from '../split'
import type { DetectedFile } from './detect'
import type { OutputFile, ReadContext, ReadResult, WriteResult } from './types'
import {
  readNames,
  readYoloImages,
  writeYoloLabels,
  type YoloImageSource,
  type YoloTask,
} from './yolo'

export interface MindyoloReadOptions extends ReadContext {
  files: DetectedFile[]
}

interface SplitList {
  split: NamedSplit
  listPath: string
}

/** `data:` block when present, otherwise the document root. */
function configBlock(parsed: Record<string, unknown>): Record<string, unknown> {
  const data = parsed.data
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : parsed
}

/** The `*_set` entries that point at a split's image-list file. */
function splitLists(block: Record<string, unknown>, yamlPath: string): SplitList[] {
  const entries: { split: NamedSplit; key: string }[] = [
    { split: 'train', key: 'train_set' },
    { split: 'val', key: 'val_set' },
    { split: 'test', key: 'test_set' },
  ]
  const lists: SplitList[] = []
  for (const { split, key } of entries) {
    const value = block[key]
    if (typeof value !== 'string') {
      continue
    }
    const trimmed = value.trim()
    if (trimmed === '' || trimmed.toLowerCase() === 'none') {
      continue
    }
    const listPath = resolveAgainst(fileDirname(yamlPath), trimmed, '')
    if (listPath !== null) {
      lists.push({ split, listPath })
    }
  }
  return lists
}

/**
 * Resolve a config- or list-declared path to a dataset-relative POSIX path.
 *
 * `./x` is relative to `base` (matching MindYOLO, which expands `./` against
 * the declaring file's directory), a path under `root` is made relative to it,
 * and anything else relative is joined onto `base`. Returns null when an
 * absolute path cannot be tied back to the dataset.
 */
function resolveAgainst(base: string, value: string, root: string): string | null {
  const normalised = value.replace(/\\/g, '/').trim()
  const normRoot = root.replace(/\\/g, '/').replace(/\/+$/, '')
  if (normRoot && (normalised === normRoot || normalised.startsWith(`${normRoot}/`))) {
    return normalised === normRoot ? '' : normalised.slice(normRoot.length + 1)
  }
  if (normalised.startsWith('./')) {
    return joinPath(base, normalised.slice(2))
  }
  if (normalised.startsWith('/') || /^[A-Za-z]:\//.test(normalised)) {
    return null
  }
  return joinPath(base, normalised)
}

/** Read a MindYOLO dataset described by its `data.yaml` and split list files. */
export async function readMindyolo(options: MindyoloReadOptions): Promise<ReadResult> {
  const warnings: string[] = []
  const yamlEntry = options.files.find(
    (entry) => !entry.isDir && ['.yaml', '.yml'].includes(fileExtension(entry.path)),
  )
  if (!yamlEntry) {
    throw new Error('MindYOLO dataset is missing its data.yaml')
  }

  let block: Record<string, unknown> = {}
  // The whole document is kept so save can rewrite it without losing the keys
  // MindYOLO needs (`dataset_name`, the `*_set` list paths, transforms, …).
  let document: Record<string, unknown> | undefined
  try {
    const parsed = parseYaml(await options.readText(yamlEntry.path)) as Record<
      string,
      unknown
    > | null
    if (parsed && typeof parsed === 'object') {
      document = parsed
      block = configBlock(parsed)
    }
  } catch (error) {
    throw new Error(`${yamlEntry.path} could not be parsed: ${(error as Error).message}`, {
      cause: error,
    })
  }

  const names = readNames(block.names)
  const kptShape = Array.isArray(block.kpt_shape) ? block.kpt_shape.map(Number) : undefined
  const kptNames = Array.isArray(block.kpt_names) ? block.kpt_names.map(String) : undefined

  const images: YoloImageSource[] = []
  const lists = splitLists(block, yamlEntry.path)
  for (const { split, listPath } of lists) {
    let text: string
    try {
      text = await options.readText(listPath)
    } catch {
      warnings.push(`${listPath} (${split}) is missing; no ${split} images were loaded`)
      continue
    }
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (line === '') {
        continue
      }
      const imagePath = resolveAgainst(fileDirname(listPath), line, options.root)
      if (imagePath === null) {
        warnings.push(`${listPath}: "${line}" is outside the dataset and was skipped`)
        continue
      }
      images.push({ path: imagePath, split })
    }
  }

  if (images.length === 0) {
    throw new Error('the MindYOLO split files listed no images')
  }

  const result = await readYoloImages({
    root: options.root,
    readText: options.readText,
    ...(options.imageSize ? { imageSize: options.imageSize } : {}),
    ...(options.onProgress ? { onProgress: options.onProgress } : {}),
    images,
    names,
    ...(kptShape ? { kptShape } : {}),
    ...(kptNames ? { kptNames } : {}),
    yamlPath: yamlEntry.path,
  })

  const dataset: DatasetModel = {
    ...result.dataset,
    sourceFormat: 'mindyolo',
    origin: {
      ...result.dataset.origin,
      yamlPath: yamlEntry.path,
      ...(document ? { mindyoloConfig: document } : {}),
    },
  }
  return { dataset, warnings: [...warnings, ...result.warnings] }
}

export interface MindyoloWriteOptions {
  /** Which split this dataset represents, used to name the list file and config key. */
  splitName?: NamedSplit
}

/** Whether the dataset needs a pose, segment or plain detect YOLO label set. */
export function mindyoloTask(dataset: DatasetModel): YoloTask {
  if (dataset.annotations.some((annotation) => annotation.type === 'keypoints')) {
    return 'pose'
  }
  if (dataset.annotations.some((annotation) => annotation.type === 'polygon')) {
    return 'seg'
  }
  return 'detect'
}

/**
 * MindYOLO `data.yaml` with one `*_set` entry per present split, for a
 * labels-first export where the image lists live at the output root.
 */
export function formatMindyoloDataYaml(
  names: string[],
  splits: Partial<Record<NamedSplit, string>>,
): string {
  const lines = ['data:', '  dataset_name: labelall']
  for (const split of ['train', 'val', 'test'] as const) {
    const list = splits[split]
    if (list) {
      lines.push(`  ${split}_set: ${list}`)
    }
  }
  lines.push(
    `  nc: ${names.length}`,
    `  names: [${names.map((name) => JSON.stringify(name)).join(', ')}]`,
    '  train_transforms: []',
    '  test_transforms: []',
    '',
  )
  return lines.join('\n')
}

/** True for a plain object, which is what a YAML mapping parses to. */
function isMapping(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Rewrite a MindYOLO `data.yaml` for save, refreshing the class list and count
 * while carrying every other key through from the original document —
 * `dataset_name`, the `*_set` split list paths, transforms and custom entries.
 */
export function formatMindyoloConfigYaml(
  document: Record<string, unknown>,
  names: string[],
): string {
  const clone = structuredClone(document)
  const block = isMapping(clone.data) ? clone.data : clone
  block.nc = names.length
  block.names = [...names]
  return stringifyYaml(clone)
}

/** Zero-padded width of MindYOLO's numeric image names. */
const NUMERIC_NAME_WIDTH = 8

/**
 * MindYOLO's numeric name for the `index`-th image (0-based), e.g. `00000001.jpg`.
 *
 * MindYOLO derives an image's id during evaluation as `int(Path(im_file).stem)`,
 * so a purely numeric name is mandatory — every conversion script MindYOLO
 * ships renames the images for exactly this reason.
 */
export function mindyoloImageName(index: number, extension: string): string {
  return `${String(index + 1).padStart(NUMERIC_NAME_WIDTH, '0')}${extension}`
}

/** Rename one image to a numeric basename, preserving its directory. */
function numericImage(image: ImageRecord, index: number): ImageRecord {
  const extension = fileExtension(image.filePath) || '.jpg'
  return {
    ...image,
    filePath: joinPath(fileDirname(image.filePath), mindyoloImageName(index, extension)),
  }
}

/**
 * Rename every image to a purely numeric name. The label file mirrors the image
 * name, so it becomes numeric too, and keeping the directory preserves the
 * `images/`→`labels/` pairing the writers rely on.
 */
export function numericizeMindyoloImages(dataset: DatasetModel): DatasetModel {
  return { ...dataset, images: dataset.images.map(numericImage) }
}

/** The image id MindYOLO reads back from a numeric stem, or null if it is not numeric. */
function numericId(path: string): number | null {
  const stem = fileStem(path)
  return /^\d+$/.test(stem) ? Number.parseInt(stem, 10) : null
}

/**
 * COCO-format annotations for MindYOLO's evaluation stage.
 *
 * Mirrors the official `crejson.py` recipe: `file_name` is the numeric image
 * basename, category ids are the 0-based YOLO class indices (so they line up
 * with the label files), and `image_id` is the number MindYOLO parses from the
 * image stem. Only geometry annotations are kept — image-level labels have no
 * box to score.
 */
export function mindyoloAnnotationsJson(dataset: DatasetModel): string {
  const categories = [...dataset.categories].sort((a, b) => a.id - b.id)
  const classIndex = new Map(categories.map((category, index) => [category.id, index]))
  const imageIndex = new Map<number, number>()

  const images = dataset.images.map((image, index) => {
    const id = numericId(image.filePath) ?? index + 1
    imageIndex.set(image.id, id)
    return {
      file_name: fileBasename(image.filePath),
      id,
      width: image.width,
      height: image.height,
    }
  })

  const annotations: Record<string, unknown>[] = []
  let annotationId = 1
  for (const annotation of dataset.annotations) {
    if (annotation.type === 'classification') {
      continue
    }
    const categoryId = classIndex.get(annotation.categoryId)
    const imageId = imageIndex.get(annotation.imageId)
    const bbox = annotation.bbox
    if (categoryId === undefined || imageId === undefined || !bbox) {
      continue
    }
    annotations.push({
      id: annotationId,
      image_id: imageId,
      category_id: categoryId,
      bbox: [bbox.x, bbox.y, bbox.width, bbox.height],
      area: annotation.area ?? bbox.width * bbox.height,
      iscrowd: annotation.flags?.iscrowd ? 1 : 0,
    })
    annotationId += 1
  }

  const payload = {
    images,
    annotations,
    categories: categories.map((category, index) => ({ id: index, name: category.name })),
  }
  return `${JSON.stringify(payload, null, 2)}\n`
}

/**
 * Where a split's eval JSON goes.
 *
 * MindYOLO's `test.py` hardcodes `<dir of val_set>/annotations/instances_val2017.json`,
 * so the file must carry the `2017` suffix to be found at all.
 */
export function mindyoloEvalJsonPath(split: NamedSplit): string {
  return `annotations/instances_${split}2017.json`
}

/** Serialise a dataset to MindYOLO labels, an image list, config and eval JSON. */
export function writeMindyolo(
  dataset: DatasetModel,
  options: MindyoloWriteOptions = {},
): WriteResult {
  // MindYOLO only accepts numeric image names, so the labels, the image list and
  // the eval JSON are all built from the renamed dataset.
  const placed = numericizeMindyoloImages(dataset)
  const task = mindyoloTask(placed)
  const labels = writeYoloLabels(placed, task)
  const split = options.splitName ?? 'train'

  const listName = `${options.splitName ?? 'images'}.txt`
  const list =
    placed.images.length > 0
      ? `${placed.images.map((image) => `./${image.filePath}`).join('\n')}\n`
      : ''
  const names = [...placed.categories].sort((a, b) => a.id - b.id).map((c) => c.name)
  const yaml = formatMindyoloDataYaml(names, { [split]: `./${listName}` })

  const files: OutputFile[] = [
    ...labels.files,
    { path: listName, contents: list },
    { path: mindyoloEvalJsonPath(split), contents: mindyoloAnnotationsJson(placed) },
    { path: 'data.yaml', contents: yaml },
  ]
  const images = placed.images.map((image, index) => ({
    from: dataset.images[index].filePath,
    to: image.filePath,
  }))
  return { files, warnings: labels.warnings, images }
}
