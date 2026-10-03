import { describe, expect, it } from 'vitest'

import { fixtureReader, scanFixture } from '../../test/fixtures'
import type { OutputFile } from './types'
import { readVoc, writeVoc } from './voc'

function outputContext(files: OutputFile[]) {
  return {
    files: files.map((file) => ({ path: file.path, isDir: false, size: file.contents.length })),
    readText: (path: string) => {
      const found = files.find((file) => file.path === path)
      return found ? Promise.resolve(found.contents) : Promise.reject(new Error(`missing ${path}`))
    },
  }
}

describe('readVoc', () => {
  it('converts 1-based inclusive boxes to the model convention', async () => {
    const { dataset } = await readVoc({
      root: 'voc',
      readText: fixtureReader('voc'),
      files: scanFixture('voc'),
    })
    expect(dataset.images).toHaveLength(1)
    expect(dataset.classNames).toEqual(['cat'])

    const annotation = dataset.annotations[0]
    expect(annotation.type).toBe('bbox')
    if (annotation.type === 'bbox') {
      expect(annotation.bbox).toEqual({ x: 0, y: 0, width: 10, height: 10 })
    }
  })

  it('round-trips through the writer without moving the box', async () => {
    const first = await readVoc({
      root: 'voc',
      readText: fixtureReader('voc'),
      files: scanFixture('voc'),
    })
    const written = writeVoc(first.dataset)
    expect(written.files[0].path).toBe('Annotations/img1.xml')

    const context = outputContext(written.files)
    const second = await readVoc({
      root: 'voc',
      readText: context.readText,
      files: context.files,
    })
    const annotation = second.dataset.annotations[0]
    if (annotation.type === 'bbox') {
      expect(annotation.bbox).toEqual({ x: 0, y: 0, width: 10, height: 10 })
    }
  })
})
