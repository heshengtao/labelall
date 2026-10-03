import { describe, expect, it } from 'vitest'

import { fixtureReader } from '../../test/fixtures'
import { readLabelme } from './labelme'

describe('readLabelme', () => {
  it('reads the image and maps rectangle/polygon shapes', async () => {
    const { dataset, warnings } = await readLabelme({
      root: 'labelme',
      readText: fixtureReader('labelme'),
      annotationPath: 'img1.json',
    })

    expect(dataset.sourceFormat).toBe('labelme')
    expect(dataset.images).toHaveLength(1)
    expect(dataset.images[0]).toMatchObject({
      filePath: 'img1.jpg',
      width: 320,
      height: 240,
    })
    // Class ids follow first appearance in the shapes list.
    expect(dataset.classNames).toEqual(['cat', 'dog'])

    expect(dataset.annotations).toHaveLength(2)
    const [rectangle, polygon] = dataset.annotations
    expect(rectangle.type).toBe('bbox')
    if (rectangle.type === 'bbox') {
      expect(rectangle.bbox).toEqual({ x: 10, y: 20, width: 30, height: 40 })
    }
    expect(polygon.type).toBe('polygon')
    if (polygon.type === 'polygon') {
      expect(polygon.polygons[0]).toHaveLength(4)
      expect(polygon.bbox).toEqual({ x: 5, y: 5, width: 10, height: 20 })
    }

    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('"line"')
  })

  it('rejects files that are not labelme JSON', async () => {
    await expect(
      readLabelme({ root: 'x', readText: async () => '{}', annotationPath: 'bad.json' }),
    ).rejects.toThrow(/missing the "imagePath" string/)
  })
})
