import { parse as parseYaml } from 'yaml'
import { describe, expect, it } from 'vitest'

import type { DatasetModel } from '../model'
import { fixtureReader, scanFixture } from '../../test/fixtures'
import { readCoco } from './coco'
import { readImageFolder } from './imagefolder'
import { parseLabelme, readLabelmeDataset, writeLabelme } from './labelme'
import { readMindyolo } from './mindyolo'
import { planSave } from './save'
import { readVoc } from './voc'
import { readYolo } from './yolo'

const imageSize = async () => ({ width: 640, height: 480 })

describe('planSave', () => {
  it('writes COCO back to the annotation file it was read from', async () => {
    const { dataset } = await readCoco({
      root: 'coco',
      readText: fixtureReader('coco'),
      annotationPath: 'annotations/instances_train.json',
    })

    const plan = planSave(dataset)

    expect(plan.supported).toBe(true)
    expect(plan.files.map((file) => file.path)).toEqual(['annotations/instances_train.json'])
  })

  it('strips the image directory from an in-place COCO file_name', () => {
    const dataset: DatasetModel = {
      sourceFormat: 'coco',
      root: 'x',
      images: [{ id: 0, filePath: 'images/a.jpg', width: 10, height: 10 }],
      categories: [{ id: 0, name: 'cat' }],
      annotations: [
        { type: 'bbox', imageId: 0, categoryId: 0, bbox: { x: 1, y: 1, width: 2, height: 2 } },
      ],
      origin: { annotationPath: 'annotations/instances.json', imageDir: 'images' },
    }

    const plan = planSave(dataset)
    const payload = JSON.parse(plan.files[0].contents) as { images: { file_name: string }[] }

    expect(plan.files[0].path).toBe('annotations/instances.json')
    expect(payload.images[0].file_name).toBe('a.jpg')
  })

  it('writes each VOC XML back to its original path, even outside Annotations/', async () => {
    const canonical = await readVoc({
      root: 'voc',
      readText: fixtureReader('voc'),
      files: scanFixture('voc'),
    })
    expect(planSave(canonical.dataset).files.map((file) => file.path)).toEqual([
      'Annotations/img1.xml',
    ])

    const inline = await readVoc({
      root: 'voc-inline',
      readText: fixtureReader('voc-inline'),
      files: scanFixture('voc-inline'),
    })
    expect(
      planSave(inline.dataset)
        .files.map((file) => file.path)
        .sort(),
    ).toEqual(['classA/a.xml', 'classB/b.xml'])
  })

  it('writes YOLO labels and the original data.yaml', async () => {
    const { dataset } = await readYolo({
      root: 'yolo',
      readText: fixtureReader('yolo'),
      files: scanFixture('yolo'),
      imageSize,
    })

    const plan = planSave(dataset)
    expect(plan.files.map((file) => file.path).sort()).toEqual(['data.yaml', 'labels/train/a.txt'])
  })

  it('saves a MindYOLO dataset by rewriting labels in place and its data.yaml', async () => {
    const { dataset } = await readMindyolo({
      root: 'mindyolo',
      readText: fixtureReader('mindyolo'),
      files: scanFixture('mindyolo'),
      imageSize,
    })

    const plan = planSave(dataset)

    expect(plan.supported).toBe(true)
    expect(plan.files.map((file) => file.path).sort()).toEqual([
      'data.yaml',
      'labels/train/a.txt',
      'labels/train/b.txt',
      'labels/val/c.txt',
    ])

    // The MindYOLO config block survives: dataset_name and the split lists are
    // kept, so the dataset is still recognised as MindYOLO after saving.
    const yaml = plan.files.find((file) => file.path === 'data.yaml')?.contents ?? ''
    const parsed = parseYaml(yaml) as { data: Record<string, unknown> }
    expect(parsed.data).toMatchObject({
      dataset_name: 'tiny',
      train_set: './train.txt',
      val_set: './val.txt',
      nc: 2,
    })
    expect(parsed.data.names).toEqual(['cat', 'dog'])
  })

  it('refreshes the MindYOLO class list when classes change', async () => {
    const { dataset } = await readMindyolo({
      root: 'mindyolo',
      readText: fixtureReader('mindyolo'),
      files: scanFixture('mindyolo'),
      imageSize,
    })
    const renamed = {
      ...dataset,
      categories: dataset.categories.map((category) =>
        category.id === 0 ? { ...category, name: 'kitten' } : category,
      ),
    }

    const plan = planSave(renamed)
    const yaml = plan.files.find((file) => file.path === 'data.yaml')?.contents ?? ''
    const parsed = parseYaml(yaml) as { data: { names: string[]; nc: number } }

    expect(parsed.data.names).toEqual(['kitten', 'dog'])
    expect(parsed.data.nc).toBe(2)
  })

  it('produces a MindYOLO config that still reads back as MindYOLO', async () => {
    const fixtureText = fixtureReader('mindyolo')
    const { dataset } = await readMindyolo({
      root: 'mindyolo',
      readText: fixtureText,
      files: scanFixture('mindyolo'),
      imageSize,
    })
    const plan = planSave(dataset)
    const planFiles = new Map(plan.files.map((file) => [file.path, file.contents]))

    const { dataset: reread } = await readMindyolo({
      root: 'x',
      // The saved data.yaml, with the untouched split lists from the fixture.
      readText: (path) => {
        const saved = planFiles.get(path)
        return saved !== undefined ? Promise.resolve(saved) : fixtureText(path)
      },
      files: [
        { path: 'data.yaml', isDir: false, size: 1 },
        { path: 'images', isDir: true, size: 0 },
        { path: 'labels', isDir: true, size: 0 },
      ],
      imageSize,
    })

    expect(reread.sourceFormat).toBe('mindyolo')
    expect(reread.categories.map((category) => category.name)).toEqual(['cat', 'dog'])
    expect(reread.annotations).toHaveLength(3)
  })

  it('writes one labelme JSON per image', async () => {
    const files = scanFixture('labelme')
    const { dataset } = await readLabelmeDataset({
      root: 'labelme',
      readText: fixtureReader('labelme'),
      annotationPaths: files
        .filter((entry) => entry.path.endsWith('.json'))
        .map((entry) => entry.path),
    })

    const plan = planSave(dataset)
    expect(plan.files.map((file) => file.path).sort()).toEqual(['img1.json', 'img2.json'])
  })

  it('reports that ImageFolder cannot rewrite its folder layout', async () => {
    const { dataset } = await readImageFolder({
      root: 'imagefolder',
      readText: fixtureReader('imagefolder'),
      files: scanFixture('imagefolder'),
    })

    const plan = planSave(dataset)
    expect(plan.files[0].path).toBe('classes.txt')
    expect(plan.warnings.join('\n')).toContain('class list')
  })
})

describe('writeLabelme', () => {
  it('round-trips the shapes the reader understands', () => {
    const dataset: DatasetModel = {
      sourceFormat: 'labelme',
      root: 'x',
      images: [
        { id: 0, filePath: 'img1.jpg', width: 320, height: 240, annotationPath: 'img1.json' },
      ],
      categories: [
        { id: 0, name: 'cat' },
        { id: 1, name: 'dog' },
      ],
      annotations: [
        { type: 'bbox', imageId: 0, categoryId: 0, bbox: { x: 10, y: 20, width: 30, height: 40 } },
        {
          type: 'polygon',
          imageId: 0,
          categoryId: 1,
          polygons: [
            [
              { x: 5, y: 5 },
              { x: 15, y: 5 },
              { x: 15, y: 25 },
            ],
          ],
        },
      ],
    }

    const written = writeLabelme(dataset)
    expect(written.files.map((file) => file.path)).toEqual(['img1.json'])

    const parsed = parseLabelme(written.files[0].contents, {
      root: 'x',
      annotationPath: 'img1.json',
    })
    expect(parsed.dataset.classNames).toEqual(['cat', 'dog'])
    expect(parsed.dataset.annotations.map((item) => item.type)).toEqual(['bbox', 'polygon'])
    const bbox = parsed.dataset.annotations[0]
    if (bbox.type === 'bbox') {
      expect(bbox.bbox).toEqual({ x: 10, y: 20, width: 30, height: 40 })
    }
  })

  it('drops keypoints with a warning rather than losing them silently', () => {
    const dataset: DatasetModel = {
      sourceFormat: 'labelme',
      root: 'x',
      images: [{ id: 0, filePath: 'img1.jpg', width: 10, height: 10, annotationPath: 'img1.json' }],
      categories: [{ id: 0, name: 'cat' }],
      annotations: [
        {
          type: 'keypoints',
          imageId: 0,
          categoryId: 0,
          bbox: { x: 0, y: 0, width: 1, height: 1 },
          keypoints: [{ x: 0, y: 0, v: 2 }],
          numKeypoints: 1,
        },
      ],
    }

    const written = writeLabelme(dataset)
    expect(written.warnings.join('\n')).toContain('keypoints')
  })
})
