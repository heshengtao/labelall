import { beforeEach, describe, expect, it } from 'vitest'

import { translateAnnotation } from '@/core/annotationEdits'
import type { Annotation, DatasetModel } from '@/core/model'
import { useDatasetStore } from './datasetStore'

const HANDLE = { id: 'h', root: 'x', displayName: 'x' }

function open(overrides: Partial<DatasetModel> = {}): void {
  useDatasetStore.getState().setDataset(HANDLE, { ...dataset(), ...overrides }, [])
}

function bbox(x = 0, y = 0): Annotation {
  return { type: 'bbox', imageId: 4, categoryId: 0, bbox: { x, y, width: 10, height: 10 } }
}

function annotations(): Annotation[] {
  return useDatasetStore.getState().dataset?.annotations ?? []
}

function dataset(): DatasetModel {
  return {
    sourceFormat: 'imagefolder',
    root: 'x',
    images: [
      { id: 4, filePath: 'a.jpg', width: 0, height: 0 },
      { id: 5, filePath: 'b.jpg', width: 0, height: 0 },
    ],
    categories: [],
    annotations: [],
  }
}

beforeEach(() => {
  useDatasetStore.getState().close()
})

describe('datasetStore', () => {
  it('selects the first image when a dataset is set', () => {
    useDatasetStore.getState().setDataset({ id: 'h', root: 'x', displayName: 'x' }, dataset(), [])
    expect(useDatasetStore.getState().currentImageId).toBe(4)
  })

  it('handles an empty dataset', () => {
    const empty: DatasetModel = { ...dataset(), images: [] }
    useDatasetStore.getState().setDataset({ id: 'h', root: 'x', displayName: 'x' }, empty, [])
    expect(useDatasetStore.getState().currentImageId).toBeNull()
  })

  it('close() resets everything', () => {
    useDatasetStore.getState().setDataset(HANDLE, dataset(), ['w'])
    useDatasetStore.getState().close()
    expect(useDatasetStore.getState().dataset).toBeNull()
    expect(useDatasetStore.getState().warnings).toEqual([])
    expect(useDatasetStore.getState().currentImageId).toBeNull()
  })
})

describe('annotation editing', () => {
  it('adds an annotation, selects it and can undo/redo', () => {
    open()
    useDatasetStore.getState().addAnnotation(bbox())
    expect(annotations()).toHaveLength(1)
    expect(useDatasetStore.getState().selectedAnnotationIndex).toBe(0)

    useDatasetStore.getState().undo()
    expect(annotations()).toHaveLength(0)

    useDatasetStore.getState().redo()
    expect(annotations()).toHaveLength(1)
  })

  it('moves an annotation and restores it on undo', () => {
    open()
    useDatasetStore.getState().addAnnotation(bbox())
    useDatasetStore
      .getState()
      .updateAnnotation(0, (item) => translateAnnotation(item, 5, 7), 'move')

    const moved = annotations()[0]
    expect(moved.type === 'bbox' && moved.bbox).toEqual({ x: 5, y: 7, width: 10, height: 10 })

    useDatasetStore.getState().undo()
    const restored = annotations()[0]
    expect(restored.type === 'bbox' && restored.bbox.x).toBe(0)
  })

  it('deletes and duplicates annotations', () => {
    open()
    useDatasetStore.getState().addAnnotation(bbox())
    useDatasetStore.getState().duplicateAnnotation(0)
    expect(annotations()).toHaveLength(2)
    expect(useDatasetStore.getState().selectedAnnotationIndex).toBe(1)

    useDatasetStore.getState().deleteAnnotation(0)
    expect(annotations()).toHaveLength(1)
    // The neighbour stays selected, so Delete does not go grey after one use.
    expect(useDatasetStore.getState().selectedAnnotationIndex).toBe(0)
  })

  it('toggles an image-level label instead of stacking duplicates', () => {
    open()
    useDatasetStore.getState().toggleClassification(4, 7)
    expect(annotations()).toHaveLength(1)
    expect(annotations()[0]).toMatchObject({ type: 'classification', imageId: 4, categoryId: 7 })

    // Clicking again removes it rather than adding a second identical label.
    useDatasetStore.getState().toggleClassification(4, 7)
    expect(annotations()).toHaveLength(0)
  })

  it('keeps a neighbouring selection after deleting so the button stays usable', () => {
    open()
    useDatasetStore.getState().addAnnotation(bbox(0, 0))
    useDatasetStore.getState().addAnnotation(bbox(5, 5))
    useDatasetStore.getState().addAnnotation(bbox(10, 10))

    useDatasetStore.getState().deleteAnnotation(1)
    expect(annotations()).toHaveLength(2)
    expect(useDatasetStore.getState().selectedAnnotationIndex).not.toBeNull()

    useDatasetStore
      .getState()
      .deleteAnnotation(useDatasetStore.getState().selectedAnnotationIndex ?? 0)
    expect(useDatasetStore.getState().selectedAnnotationIndex).not.toBeNull()

    useDatasetStore
      .getState()
      .deleteAnnotation(useDatasetStore.getState().selectedAnnotationIndex ?? 0)
    expect(useDatasetStore.getState().selectedAnnotationIndex).toBeNull()
  })

  it('manages categories and drops their annotations', () => {
    open()
    useDatasetStore.getState().addCategory('cat')
    expect(useDatasetStore.getState().dataset?.categories).toHaveLength(1)

    useDatasetStore.getState().addAnnotation(bbox())
    useDatasetStore.getState().deleteCategory(0)
    expect(useDatasetStore.getState().dataset?.categories).toHaveLength(0)
    expect(annotations()).toHaveLength(0)

    useDatasetStore.getState().undo()
    expect(useDatasetStore.getState().dataset?.categories).toHaveLength(1)
    expect(annotations()).toHaveLength(1)
  })
})
