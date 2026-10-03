/**
 * Classification / ImageFolder reader.
 *
 * Layout: `root/<class>/<image>` with optional `root/<split>/<class>/<image>`.
 *
 * Torchvision's `ImageFolder` defines class ids by **lexicographic directory
 * order**, which is what we use when there is no explicit class list. When the
 * root contains `classes.txt`, its line order wins (line index = class id) since
 * that file is the conventional way to pin an order. ImageNet's WordNet-id
 * directories are resolved to readable names through a `*synset_mapping*.txt`
 * file when one is present.
 */

import type { Category, ClassificationAnnotation, DatasetModel, ImageRecord, Split } from '../model'
import { assignCategoryColors } from '../palette'
import { fileBasename, fileExtension } from '../path'
import { IMAGE_EXTENSIONS, type DetectedFile } from './detect'
import type { ReadContext, ReadResult } from './types'

const KNOWN_SPLITS = new Set(['train', 'training', 'val', 'valid', 'validation', 'test', 'testing'])

const CLASS_LIST_FILES = ['classes.txt', 'labels.txt', 'predefined_classes.txt']
const SYNSET_MAPPING_FILES = ['LOC_synset_mapping.txt', 'loc_synset_mapping.txt']

export interface ImageFolderReadOptions extends ReadContext {
  /** File listing used to discover images. */
  files: DetectedFile[]
}

function isImage(path: string): boolean {
  return IMAGE_EXTENSIONS.has(fileExtension(path))
}

async function readLines(ctx: ReadContext, path: string): Promise<string[] | null> {
  try {
    const text = await ctx.readText(path)
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  } catch {
    return null
  }
}

/** Parse `LOC_synset_mapping.txt`: `<wnid> name, name, …` per line. */
async function readSynsetMapping(ctx: ReadContext): Promise<Map<string, string> | null> {
  for (const candidate of SYNSET_MAPPING_FILES) {
    const lines = await readLines(ctx, candidate)
    if (!lines) {
      continue
    }
    const mapping = new Map<string, string>()
    for (const line of lines) {
      const match = /^(\S+)\s+(.*)$/.exec(line)
      if (match) {
        mapping.set(match[1], match[2].replace(/,\s*/g, ', ').trim())
      }
    }
    return mapping.size > 0 ? mapping : null
  }
  return null
}

/** Parse a plain class list: one class name per line, line index = class id. */
async function readClassList(ctx: ReadContext): Promise<string[] | null> {
  for (const candidate of CLASS_LIST_FILES) {
    const lines = await readLines(ctx, candidate)
    if (lines && lines.length > 0) {
      return lines
    }
  }
  return null
}

export async function readImageFolder(options: ImageFolderReadOptions): Promise<ReadResult> {
  const warnings: string[] = []
  const imageFiles = options.files.filter((entry) => !entry.isDir && isImage(entry.path))

  if (imageFiles.length === 0) {
    warnings.push('No image files were found in this folder.')
    return {
      dataset: {
        sourceFormat: 'imagefolder',
        root: options.root,
        images: [],
        categories: [],
        annotations: [],
      },
      warnings,
    }
  }

  // Resolve the class directory (and split) for each image.
  const imageClassNames: (string | null)[] = []
  const splits: (Split | undefined)[] = []
  for (const file of imageFiles) {
    const segments = file.path.split('/')
    if (segments.length >= 3 && KNOWN_SPLITS.has(segments[0].toLowerCase())) {
      imageClassNames.push(segments[1])
      splits.push(segments[0])
    } else if (segments.length >= 2) {
      imageClassNames.push(segments[0])
      splits.push(undefined)
    } else {
      imageClassNames.push(null)
      splits.push(undefined)
    }
  }

  const flatCount = imageClassNames.filter((name) => name === null).length
  if (flatCount > 0) {
    warnings.push(
      `${flatCount} image(s) sit directly in the root without a class directory and were given no label`,
    )
  }

  const discovered = [...new Set(imageClassNames.filter((name): name is string => name !== null))]

  // Prefer an explicit class list, then the conventional lexicographic order.
  const classList = await readClassList(options)
  const synsetMapping = await readSynsetMapping(options)

  let orderedNames: string[]
  if (classList) {
    orderedNames = [...classList]
    for (const name of discovered) {
      if (!orderedNames.includes(name)) {
        orderedNames.push(name)
      }
    }
    const unused = orderedNames.filter((name) => !discovered.includes(name))
    if (unused.length > 0) {
      warnings.push(
        `${unused.length} class(es) listed in the class file have no images: ${unused.slice(0, 5).join(', ')}${unused.length > 5 ? '…' : ''}`,
      )
    }
  } else {
    orderedNames = [...discovered].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  }

  if (orderedNames.length === 0) {
    warnings.push('No class directories were found, so no classification labels were created')
  }

  const categories: Category[] = orderedNames.map((name, index) => {
    const displayName = synsetMapping?.get(name)
    return {
      id: index,
      name,
      ...(displayName && displayName !== name ? { displayName } : {}),
    }
  })

  const categoryIdByName = new Map(categories.map((category) => [category.name, category.id]))

  const images: ImageRecord[] = imageFiles.map((file, index) => ({
    id: index,
    filePath: file.path,
    fileName: fileBasename(file.path),
    // Dimensions are unknown for classification layouts; they are filled in
    // lazily from the image header by the platform layer.
    width: 0,
    height: 0,
    ...(splits[index] ? { split: splits[index] } : {}),
  }))

  const annotations: ClassificationAnnotation[] = []
  imageClassNames.forEach((className, index) => {
    if (className === null) {
      return
    }
    const categoryId = categoryIdByName.get(className)
    if (categoryId === undefined) {
      return
    }
    annotations.push({ type: 'classification', imageId: index, categoryId })
  })

  const dataset: DatasetModel = {
    sourceFormat: 'imagefolder',
    root: options.root,
    images,
    categories: assignCategoryColors(categories),
    annotations,
    classNames: categories.map((category) => category.name),
  }

  return { dataset, warnings }
}
