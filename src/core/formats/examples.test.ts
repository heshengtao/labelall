import { describe, expect, it } from 'vitest'

import { directoryReader, exampleDir, scanDirectory } from '../../test/fixtures'
import { detectFormat } from './detect'
import { readVoc } from './voc'

// The bundled example must stay openable: it is what people try first.
describe('examples/voc-mini', () => {
  const root = exampleDir('voc-mini')

  it('is detected as Pascal VOC', async () => {
    const candidates = await detectFormat({
      files: scanDirectory(root),
      readText: directoryReader(root),
    })
    expect(candidates[0]).toMatchObject({ format: 'voc', confidence: 1 })
  })

  it('reads three images, two classes and six boxes', async () => {
    const { dataset, warnings } = await readVoc({
      root: 'voc-mini',
      files: scanDirectory(root),
      readText: directoryReader(root),
    })
    expect(dataset.images).toHaveLength(3)
    expect([...(dataset.classNames ?? [])].sort()).toEqual(['circle', 'rectangle'])
    expect(dataset.annotations).toHaveLength(6)
    expect(warnings).toEqual([])
  })
})
