import type { VocBoxPolicy } from './geometry'

/**
 * The unified, format-independent dataset model.
 *
 * Every reader converts its on-disk representation into these types, and every
 * writer converts back out again. Coordinate convention for the whole model is
 * **absolute pixels, 0-based, top-left origin, continuous** (matching COCO and
 * torchvision). Format-specific quirks — VOC's 1-based inclusive boxes, YOLO's
 * normalised values, Label Studio's percentages — must be normalised inside the
 * readers/writers and never leak into this model.
 */

/**
 * Everything needed to write a dataset back into the layout it was read from,
 * so "save" can overwrite the original files instead of exporting a copy.
 *
 * All paths are relative to the dataset root. Readers fill this in; writers and
 * the save flow read it. It is deliberately separate from the canonical paths
 * the export writers use, because the files a dataset was read from do not
 * always follow the canonical layout (e.g. VOC XMLs sitting next to their
 * images rather than under `Annotations/`).
 */
export interface DatasetOrigin {
  /** COCO: the single annotation JSON to overwrite. */
  annotationPath?: string
  /** Directory that image references are relative to (COCO `file_name`, labelme `imagePath`). */
  imageDir?: string
  /** YOLO: the `data.yaml`/`*.yaml` to overwrite. */
  yamlPath?: string
  /**
   * MindYOLO: the parsed `data.yaml` document. Save rewrites it in place,
   * keeping `dataset_name`, the split `*_set` paths and any custom keys while
   * refreshing `nc`/`names`.
   */
  mindyoloConfig?: Record<string, unknown>
  /** VOC: the coordinate policy the dataset was read with, so writing inverts it exactly. */
  boxPolicy?: VocBoxPolicy
  /** YOLO: ids of images that had a non-empty label file, so a cleared label is still written. */
  labelledImageIds?: number[]
}

export interface Point {
  x: number
  y: number
}

/** Top-left corner plus extents (not a second corner). */
export interface BBox {
  x: number
  y: number
  width: number
  height: number
}

/** Ordered vertices, absolute pixels. The first point is NOT repeated at the end. */
export type Polygon = Point[]

/**
 * A segmentation mask in whichever encoding the source format used.
 *
 * - `polygon` — one or more polygons (COCO `iscrowd=0`, YOLO-seg)
 * - `rle`     — run-length encoded binary mask (COCO `iscrowd=1`); `size` is
 *               `[height, width]` and `counts` is either a plain number array or
 *               a compressed LEB128 string
 * - `png`     — an indexed mask image on disk (VOC segmentation PNGs)
 */
export type Mask =
  | { encoding: 'polygon'; polygons: Polygon[] }
  | { encoding: 'rle'; size: [number, number]; counts: number[] | string }
  | { encoding: 'png'; path: string; indexed: boolean; voidIndex?: number }

/**
 * Keypoint visibility, following the COCO definition:
 * `0` not labelled, `1` labelled but not visible, `2` labelled and visible.
 */
export type KpVisibility = 0 | 1 | 2

export interface Keypoint {
  x: number
  y: number
  v: KpVisibility
  name?: string
}

export interface KeypointSchema {
  /** Keypoint names, in order. Length defines the number of keypoints. */
  names: string[]
  /**
   * Pairs of keypoint indices that form the skeleton.
   * NOTE: COCO stores these as **1-based** indices while `names` is 0-based.
   */
  skeleton?: [number, number][]
  /** YOLO `flip_idx`, 0-based. */
  flipIdx?: number[]
  /** YOLO `kpt_oks_sigmas` / OKS sigmas. */
  sigmas?: number[]
  /** `2` = `(x, y)`, `3` = `(x, y, visibility)`. Mirrors YOLO `kpt_shape[1]`. */
  dims: 2 | 3
}

export interface Category {
  id: number
  name: string
  /** Human-readable alternative to `name`, e.g. the synset text for an ImageNet wnid. */
  displayName?: string
  supercategory?: string
  /** Display colour as `#rrggbb`. */
  color?: string
  /** Present only when this category is a keypoint class. */
  keypointSchema?: KeypointSchema
}

export type Split = 'train' | 'val' | 'test' | (string & {})

export interface ImageRecord {
  id: number
  /** Path relative to the dataset root, always using `/` separators. */
  filePath: string
  width: number
  height: number
  split?: Split
  /** Basename, kept for formats (VOC, YOLO) that echo it separately. */
  fileName?: string
  /** Format-specific metadata carried through unchanged. */
  source?: Record<string, unknown>
  /**
   * Relative path of the annotation file this image's annotations were read
   * from (VOC XML, labelme JSON). Absent for formats that keep every annotation
   * in one dataset-level file, or that derive labels from the folder layout.
   */
  annotationPath?: string
}

export interface AnnotationFlags {
  /** VOC `<difficult>`; semantically closer to "ignore" than COCO's `iscrowd`. */
  difficult?: boolean
  truncated?: boolean
  occluded?: boolean
  ignore?: boolean
  /** COCO `iscrowd`. */
  iscrowd?: boolean
}

export interface AnnotationBase {
  /** COCO annotation id. Undefined for formats without annotation ids. */
  id?: number
  imageId: number
  categoryId: number
  /** Prediction confidence; absent in ground truth. */
  score?: number
  /** Free-form attributes, passed through from formats that support them. */
  attributes?: Record<string, unknown>
  flags?: AnnotationFlags
}

export interface BBoxAnnotation extends AnnotationBase {
  type: 'bbox'
  bbox: BBox
  area?: number
  /** COCO keeps a segmentation alongside the box for the same instance. */
  mask?: Mask
}

export interface PolygonAnnotation extends AnnotationBase {
  type: 'polygon'
  polygons: Polygon[]
  bbox?: BBox
  area?: number
  mask?: Mask
}

export interface MaskAnnotation extends AnnotationBase {
  type: 'mask'
  mask: Mask
  bbox?: BBox
  area?: number
}

export interface KeypointAnnotation extends AnnotationBase {
  type: 'keypoints'
  bbox: BBox
  keypoints: Keypoint[]
  /** Count of keypoints with `v > 0`. Mirrors COCO `num_keypoints`. */
  numKeypoints: number
  area?: number
}

/** An image-level label; carries no geometry. */
export interface ClassificationAnnotation {
  type: 'classification'
  imageId: number
  categoryId: number
  /** `1` = positive, `0` = negative for VOC-style sets; model score otherwise. */
  confidence?: number
  annotationId?: number
}

export type Annotation =
  | BBoxAnnotation
  | PolygonAnnotation
  | MaskAnnotation
  | KeypointAnnotation
  | ClassificationAnnotation

export type AnnotationType = Annotation['type']

export type SourceFormat =
  | 'coco'
  | 'yolo'
  | 'yolo-seg'
  | 'yolo-pose'
  | 'mindyolo'
  | 'voc'
  | 'imagefolder'
  | 'labelme'
  | 'csv'
  | 'other'

export interface DatasetInfo {
  description?: string
  url?: string
  version?: string
  year?: number
  contributor?: string
  dateCreated?: string
}

export interface License {
  id: number
  name: string
  url?: string
}

export interface DatasetModel {
  sourceFormat: SourceFormat
  /** Dataset root on disk (or the display name for browser-loaded folders). */
  root: string
  images: ImageRecord[]
  categories: Category[]
  annotations: Annotation[]
  /** Class names in index order, mirroring YOLO `names` / `classes.txt`. */
  classNames?: string[]
  info?: DatasetInfo
  licenses?: License[]
  /** Format-specific leftovers that do not map cleanly onto the model. */
  extras?: Record<string, unknown>
  /** How to write this dataset back to disk in its original layout. */
  origin?: DatasetOrigin
}

/** Create an empty dataset for a given format and root. */
export function createEmptyDataset(
  root: string,
  sourceFormat: SourceFormat = 'other',
): DatasetModel {
  return {
    sourceFormat,
    root,
    images: [],
    categories: [],
    annotations: [],
  }
}
