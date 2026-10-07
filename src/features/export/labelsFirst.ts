/**
 * Labels-first split layout.
 *
 * The generic split-first layout nests everything under `<split>/`. The
 * labels-first layout instead keeps the format's content directories at the
 * root and puts the split inside them — the layout Ultralytics and MindYOLO
 * expect:
 *
 *   images/train/…  images/val/…      labels/train/…  labels/val/…
 *   data.yaml       classes.txt
 *
 * Only formats with an images/labels (or images/annotations) pair have a
 * meaningful labels-first form, so `supportsLabelsFirst` gates it. Images are
 * relocated into `<container>/<split>/…`, which is why the caller gets back the
 * source→destination mappings it needs to copy them.
 */

import type { ExportFormat } from '@/core/formats/losses'
import {
  formatMindyoloDataYaml,
  mindyoloAnnotationsJson,
  mindyoloEvalJsonPath,
  mindyoloImageName,
  mindyoloTask,
} from '@/core/formats/mindyolo'
import type { OutputFile } from '@/core/formats/types'
import { writeCoco } from '@/core/formats/coco'
import { writeVoc } from '@/core/formats/voc'
import { formatYoloDataYaml, writeYoloLabels, type YoloTask } from '@/core/formats/yolo'
import type { DatasetModel, KeypointSchema } from '@/core/model'
import { fileBasename, fileExtension, fileStem } from '@/core/path'
import type { NamedSplit } from '@/core/split'
import type { ImageCopy } from '@/platform/types'

const LABELS_FIRST_FORMATS: ReadonlySet<ExportFormat> = new Set<ExportFormat>([
  'coco',
  'voc',
  'yolo-detect',
  'yolo-seg',
  'yolo-pose',
  'mindyolo',
])

/** Whether this format has a labels-first layout at all. */
export function supportsLabelsFirst(format: ExportFormat): boolean {
  return LABELS_FIRST_FORMATS.has(format)
}

/** Where this format keeps its images in the labels-first layout. */
function imageDirFor(format: ExportFormat): string {
  return format === 'voc' ? 'JPEGImages' : 'images'
}

function yoloTaskFor(format: ExportFormat): YoloTask {
  if (format === 'yolo-seg') return 'seg'
  if (format === 'yolo-pose') return 'pose'
  return 'detect'
}

function sortedCategories(dataset: DatasetModel): DatasetModel['categories'] {
  return [...dataset.categories].sort((a, b) => a.id - b.id)
}

export interface LabelsFirstSplit {
  files: OutputFile[]
  /** Source→destination mapping for the images this split references. */
  images: ImageCopy[]
  warnings: string[]
}

/**
 * Build one split's labels-first files, relocating its images under
 * `<container>/<split>/`.
 *
 * Every other format keeps the source basenames, de-duplicated within the split
 * so two images with the same name do not overwrite each other. MindYOLO is the
 * exception: it addresses images by the number parsed from the file stem during
 * evaluation, so they are renamed to `00000001.jpg`, `00000002.jpg`, … instead.
 */
export function labelsFirstSplit(
  dataset: DatasetModel,
  format: ExportFormat,
  split: NamedSplit,
): LabelsFirstSplit {
  const dir = imageDirFor(format)
  const used = new Set<string>()
  const images: ImageCopy[] = []
  const records = dataset.images.map((image, index) => {
    const base = fileBasename(image.filePath)
    const extension = fileExtension(base)
    let name: string
    if (format === 'mindyolo') {
      name = mindyoloImageName(index, extension || '.jpg')
    } else {
      name = base
      let counter = 2
      while (used.has(name)) {
        name = `${fileStem(base)}-${counter}${extension}`
        counter += 1
      }
      used.add(name)
    }
    const to = `${dir}/${split}/${name}`
    images.push({ from: image.filePath, to })
    return { ...image, filePath: to }
  })

  const placed: DatasetModel = { ...dataset, images: records }
  const files: OutputFile[] = []
  const warnings: string[] = []

  if (format === 'coco') {
    const result = writeCoco(placed, {
      path: `annotations/instances_${split}.json`,
      imageDir: 'images',
    })
    files.push(...result.files)
    warnings.push(...result.warnings)
  } else if (format === 'voc') {
    const result = writeVoc(placed, {
      pathFor: (image) => `Annotations/${split}/${fileStem(image.filePath)}.xml`,
    })
    files.push(...result.files)
    warnings.push(...result.warnings)
  } else if (format === 'mindyolo') {
    const result = writeYoloLabels(placed, mindyoloTask(placed))
    files.push(...result.files)
    warnings.push(...result.warnings)
    const list = placed.images.map((image) => `./${image.filePath}`).join('\n')
    files.push({ path: `${split}.txt`, contents: list.length > 0 ? `${list}\n` : '' })
    files.push({
      path: mindyoloEvalJsonPath(split),
      contents: mindyoloAnnotationsJson(placed),
    })
  } else {
    const result = writeYoloLabels(placed, yoloTaskFor(format))
    files.push(...result.files)
    warnings.push(...result.warnings)
  }

  return { files, images, warnings }
}

/**
 * The dataset-level files a labels-first export writes once at the root, after
 * every split has been placed: YOLO/MindYOLO `data.yaml` and `classes.txt`.
 */
export function labelsFirstRootFiles(
  dataset: DatasetModel,
  format: ExportFormat,
  splits: readonly NamedSplit[],
): OutputFile[] {
  const names = sortedCategories(dataset).map((category) => category.name)
  if (format === 'mindyolo') {
    const lists: Partial<Record<NamedSplit, string>> = {}
    for (const split of splits) {
      lists[split] = `./${split}.txt`
    }
    return [
      { path: 'data.yaml', contents: formatMindyoloDataYaml(names, lists) },
      { path: 'classes.txt', contents: `${names.join('\n')}\n` },
    ]
  }

  if (format.startsWith('yolo')) {
    const dirs: Partial<Record<NamedSplit, string>> = {}
    for (const split of splits) {
      dirs[split] = `${imageDirFor(format)}/${split}`
    }
    const schema: KeypointSchema | undefined = sortedCategories(dataset).find(
      (category) => category.keypointSchema,
    )?.keypointSchema
    return [
      { path: 'data.yaml', contents: formatYoloDataYaml(names, schema, dirs) },
      { path: 'classes.txt', contents: `${names.join('\n')}\n` },
    ]
  }

  return []
}
