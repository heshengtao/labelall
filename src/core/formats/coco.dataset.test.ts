import { describe, expect, it } from 'vitest'

import { readCocoDataset } from './coco'

function makeCoco(images: object[], categories: object[], annotations: object[]): string {
  return JSON.stringify({ images, categories, annotations })
}

const train = makeCoco(
  [{ id: 1, file_name: 'a.jpg', width: 10, height: 10 }],
  [{ id: 1, name: 'cat' }],
  [{ id: 1, image_id: 1, category_id: 1, bbox: [0, 0, 4, 4] }],
)

const val = makeCoco(
  [{ id: 1, file_name: 'b.jpg', width: 20, height: 20 }],
  [
    { id: 1, name: 'cat' },
    { id: 2, name: 'dog' },
  ],
  [
    { id: 2, image_id: 1, category_id: 2, bbox: [1, 1, 3, 3] },
    { id: 3, image_id: 1, category_id: 1, bbox: [2, 2, 5, 5] },
  ],
)

describe('readCocoDataset', () => {
  it('merges split files, renumbering ids and unioning categories by name', async () => {
    const files: Record<string, string> = {
      'annotations/instances_train.json': train,
      'annotations/instances_val.json': val,
    }
    const { dataset } = await readCocoDataset({
      root: 'x',
      readText: (path) => {
        const contents = files[path]
        return contents !== undefined
          ? Promise.resolve(contents)
          : Promise.reject(new Error(`missing ${path}`))
      },
      sources: [
        { annotationPath: 'annotations/instances_train.json', split: 'train' },
        { annotationPath: 'annotations/instances_val.json', split: 'val' },
      ],
    })

    expect(dataset.images.map((image) => [image.id, image.split, image.filePath])).toEqual([
      [0, 'train', 'a.jpg'],
      [1, 'val', 'b.jpg'],
    ])
    expect(dataset.categories.map((category) => category.name)).toEqual(['cat', 'dog'])
    expect(dataset.annotations).toHaveLength(3)
    // val's `dog` (id 2) becomes the merged dataset's second category (id 1).
    expect(dataset.annotations[1]).toMatchObject({ imageId: 1, categoryId: 1 })
  })

  it('loads what it can when a split file is missing', async () => {
    const files: Record<string, string> = {
      'annotations/instances_train.json': train,
    }
    const { dataset, warnings } = await readCocoDataset({
      root: 'x',
      readText: (path) => {
        const contents = files[path]
        return contents !== undefined
          ? Promise.resolve(contents)
          : Promise.reject(new Error(`missing ${path}`))
      },
      sources: [
        { annotationPath: 'annotations/instances_train.json', split: 'train' },
        { annotationPath: 'annotations/instances_test.json', split: 'test' },
      ],
    })

    expect(dataset.images.map((image) => image.split)).toEqual(['train'])
    expect(warnings.join('\n')).toContain('instances_test.json')
  })
})
