/**
 * Reader dispatch.
 *
 * Turns a detection result plus a file listing into a parsed dataset by calling
 * the right format reader. Kept free of any I/O so it can run in a Web Worker —
 * the caller supplies `readText`, which in the desktop build proxies through the
 * Rust commands and in the web build through the File System Access API.
 */

import type { SourceFormat } from '../model'
import { readCoco } from './coco'
import type { DatasetParams, DetectedFile } from './detect'
import { readImageFolder } from './imagefolder'
import { readLabelmeDataset } from './labelme'
import type { ReadContext, ReadResult } from './types'

/** Formats that have a reader today; the rest arrive in later milestones. */
export const READABLE_FORMATS: ReadonlySet<SourceFormat> = new Set<SourceFormat>([
  'coco',
  'imagefolder',
  'labelme',
])

export interface ParseRequest {
  format: SourceFormat
  /** The dataset listing, as produced by `scan`. */
  files: DetectedFile[]
  /** Parameters discovered by the format detector. */
  params?: DatasetParams
}

export async function parseDataset(request: ParseRequest, ctx: ReadContext): Promise<ReadResult> {
  const { format, files, params } = request

  switch (format) {
    case 'coco': {
      const annotationPath = params?.annotationPath
      if (!annotationPath) {
        throw new Error('COCO dataset is missing its annotation file')
      }
      return readCoco({
        root: ctx.root,
        readText: ctx.readText,
        annotationPath,
        ...(params?.imageDir ? { imageDir: params.imageDir } : {}),
        ...(params?.split ? { split: params.split } : {}),
      })
    }

    case 'imagefolder':
      return readImageFolder({ root: ctx.root, readText: ctx.readText, files })

    case 'labelme':
      return readLabelmeDataset({
        root: ctx.root,
        readText: ctx.readText,
        annotationPaths: params?.annotationPaths ?? [],
        ...(params?.imageDir ? { imageDir: params.imageDir } : {}),
      })

    default:
      throw new Error(`reading the "${format}" format is not implemented yet`)
  }
}
