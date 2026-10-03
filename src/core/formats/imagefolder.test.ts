import { describe, expect, it } from 'vitest'

import { fixtureReader, scanFixture } from '../../test/fixtures'
import { readImageFolder } from './imagefolder'

describe('readImageFolder', () => {
  it('orders classes lexicographically and assigns classification labels', async () => {
    const { dataset, warnings } = await readImageFolder({
      root: 'imagefolder',
      readText: fixtureReader('imagefolder'),
      files: scanFixture('imagefolder'),
    })

    expect(dataset.sourceFormat).toBe('imagefolder')
    expect(dataset.images).toHaveLength(4)
    // bird < cat < dog (torchvision's lexicographic directory order).
    expect(dataset.classNames).toEqual(['bird', 'cat', 'dog'])

    expect(dataset.annotations).toHaveLength(4)
    expect(dataset.annotations.every((annotation) => annotation.type === 'classification')).toBe(
      true,
    )
    const labels = dataset.annotations.map(
      (annotation) =>
        dataset.categories.find((category) => category.id === annotation.categoryId)?.name,
    )
    expect(labels).toEqual(['cat', 'dog', 'bird', 'cat'])
    expect(warnings).toEqual([])
  })

  it('records the split from a leading train/val/test directory', async () => {
    const { dataset } = await readImageFolder({
      root: 'imagefolder',
      readText: fixtureReader('imagefolder'),
      files: scanFixture('imagefolder'),
    })
    expect(dataset.images.map((image) => image.split)).toEqual(['train', 'train', 'val', 'val'])
  })

  it('honours an explicit classes.txt over the lexicographic order', async () => {
    const { dataset } = await readImageFolder({
      root: 'x',
      readText: async (path) => (path === 'classes.txt' ? 'dog\ncat\n' : ''),
      files: [
        { path: 'cat/a.jpg', isDir: false, size: 0 },
        { path: 'dog/b.jpg', isDir: false, size: 0 },
      ],
    })
    expect(dataset.classNames).toEqual(['dog', 'cat'])
    expect(dataset.annotations.map((annotation) => annotation.categoryId)).toEqual([1, 0])
  })

  it('warns about images that sit directly in the root', async () => {
    const { dataset, warnings } = await readImageFolder({
      root: 'x',
      readText: async () => '',
      files: [{ path: 'loose.jpg', isDir: false, size: 0 }],
    })
    expect(dataset.images).toHaveLength(1)
    expect(dataset.categories).toEqual([])
    expect(dataset.annotations).toEqual([])
    expect(warnings.join('\n')).toContain('without a class directory')
  })
})
