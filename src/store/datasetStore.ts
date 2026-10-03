import type { Draft } from 'immer'
import { create } from 'zustand'

import { duplicateAnnotation } from '@/core/annotationEdits'
import type { DetectionCandidate, DetectedFile } from '@/core/formats/detect'
import type { Annotation, Category, DatasetModel } from '@/core/model'
import { colorForIndex } from '@/core/palette'
import type { DatasetHandle } from '@/platform/types'

import { applyEdit, emptyHistory, redoEdit, undoEdit, type History } from './history'

export type OpenStatus = 'idle' | 'scanning' | 'detecting' | 'ready' | 'parsing' | 'error'

/**
 * Problems surfaced after an import attempt: either a failure, or the list of
 * things a lenient reader skipped. Shown in an MD3 dialog by the UI.
 */
export interface ImportReport {
  severity: 'warning' | 'error'
  messages: string[]
}

/** A dataset that has been detected but not yet parsed. */
export interface PendingOpen {
  handle: DatasetHandle
  files: DetectedFile[]
  candidates: DetectionCandidate[]
}

interface DatasetState {
  /** Where the open-dataset flow currently is. */
  status: OpenStatus
  /** 0–1, only meaningful while scanning/detecting/parsing. */
  progress: number
  /** Problems from the last import attempt, shown in a dialog. */
  report: ImportReport | null

  handle: DatasetHandle | null
  dataset: DatasetModel | null
  warnings: string[]
  pending: PendingOpen | null
  currentImageId: number | null
  /** Index into `dataset.annotations`, or null. */
  selectedAnnotationIndex: number | null
  /** Bumped to abandon an in-flight open; results from older generations are dropped. */
  generation: number
  /** Undo/redo stack for edits to the dataset. */
  history: History

  setStatus(status: OpenStatus): void
  setProgress(progress: number): void
  setReport(report: ImportReport | null): void
  setPending(pending: PendingOpen | null): void
  setDataset(handle: DatasetHandle, dataset: DatasetModel, warnings: string[]): void
  selectImage(imageId: number | null): void
  selectAnnotation(index: number | null): void
  invalidateOpen(): void
  close(): void

  edit(recipe: (draft: Draft<DatasetModel>) => void, label: string): void
  undo(): void
  redo(): void

  addAnnotation(annotation: Annotation, label?: string): void
  updateAnnotation(
    index: number,
    update: (annotation: Annotation) => Annotation,
    label: string,
  ): void
  deleteAnnotation(index: number): void
  duplicateAnnotation(index: number): void
  /** Add this class as an image-level label, or remove it if it is already there. */
  toggleClassification(imageId: number, categoryId: number): void

  addCategory(name: string): void
  updateCategory(id: number, patch: Partial<Category>): void
  deleteCategory(id: number): void
}

/** Closest remaining annotation of the same image, so deleting keeps a selection. */
function nearestIndexForImage(
  dataset: DatasetModel,
  imageId: number | null,
  removed: number,
): number | null {
  if (imageId === null) {
    return null
  }
  const indices: number[] = []
  dataset.annotations.forEach((annotation, index) => {
    if (annotation.imageId === imageId) {
      indices.push(index)
    }
  })
  if (indices.length === 0) {
    return null
  }
  return indices.reduce(
    (best, index) => (Math.abs(index - removed) < Math.abs(best - removed) ? index : best),
    indices[0],
  )
}

const initialState = {
  status: 'idle' as OpenStatus,
  progress: 0,
  report: null as ImportReport | null,
  handle: null,
  dataset: null,
  warnings: [] as string[],
  pending: null,
  currentImageId: null,
  selectedAnnotationIndex: null,
  generation: 0,
  history: emptyHistory,
}

export const useDatasetStore = create<DatasetState>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setReport: (report) => set({ report }),
  setPending: (pending) => set({ pending }),

  setDataset: (handle, dataset, warnings) =>
    set({
      handle,
      dataset,
      warnings,
      currentImageId: dataset.images[0]?.id ?? null,
      selectedAnnotationIndex: null,
      history: emptyHistory,
    }),

  selectImage: (imageId) => set({ currentImageId: imageId, selectedAnnotationIndex: null }),

  selectAnnotation: (index) => set({ selectedAnnotationIndex: index }),

  invalidateOpen: () => set((state) => ({ generation: state.generation + 1 })),

  close: () => set({ ...initialState }),

  edit: (recipe, label) =>
    set((state) => {
      if (!state.dataset) {
        return {}
      }
      const result = applyEdit(state.dataset, state.history, label, recipe)
      return { dataset: result.value, history: result.history }
    }),

  undo: () =>
    set((state) => {
      if (!state.dataset) {
        return {}
      }
      const result = undoEdit(state.dataset, state.history)
      return {
        dataset: result.value,
        history: result.history,
        selectedAnnotationIndex: null,
      }
    }),

  redo: () =>
    set((state) => {
      if (!state.dataset) {
        return {}
      }
      const result = redoEdit(state.dataset, state.history)
      return {
        dataset: result.value,
        history: result.history,
        selectedAnnotationIndex: null,
      }
    }),

  addAnnotation: (annotation, label = 'add annotation') =>
    set((state) => {
      if (!state.dataset) {
        return {}
      }
      const result = applyEdit(state.dataset, state.history, label, (draft) => {
        draft.annotations.push(annotation)
      })
      return {
        dataset: result.value,
        history: result.history,
        selectedAnnotationIndex: result.value.annotations.length - 1,
      }
    }),

  updateAnnotation: (index, update, label) =>
    set((state) => {
      if (!state.dataset) {
        return {}
      }
      const result = applyEdit(state.dataset, state.history, label, (draft) => {
        const current = draft.annotations[index]
        if (current) {
          draft.annotations[index] = update(current as Annotation)
        }
      })
      return { dataset: result.value, history: result.history }
    }),

  deleteAnnotation: (index) =>
    set((state) => {
      if (!state.dataset) {
        return {}
      }
      const result = applyEdit(state.dataset, state.history, 'delete annotation', (draft) => {
        draft.annotations.splice(index, 1)
      })
      return {
        dataset: result.value,
        history: result.history,
        selectedAnnotationIndex: nearestIndexForImage(result.value, state.currentImageId, index),
      }
    }),

  toggleClassification: (imageId, categoryId) =>
    set((state) => {
      if (!state.dataset) {
        return {}
      }
      const existing = state.dataset.annotations.findIndex(
        (annotation) =>
          annotation.type === 'classification' &&
          annotation.imageId === imageId &&
          annotation.categoryId === categoryId,
      )
      if (existing >= 0) {
        const result = applyEdit(state.dataset, state.history, 'remove label', (draft) => {
          draft.annotations.splice(existing, 1)
        })
        return {
          dataset: result.value,
          history: result.history,
          selectedAnnotationIndex: null,
        }
      }
      const result = applyEdit(state.dataset, state.history, 'add label', (draft) => {
        draft.annotations.push({ type: 'classification', imageId, categoryId })
      })
      return {
        dataset: result.value,
        history: result.history,
        selectedAnnotationIndex: result.value.annotations.length - 1,
      }
    }),

  duplicateAnnotation: (index) =>
    set((state) => {
      if (!state.dataset) {
        return {}
      }
      const result = applyEdit(state.dataset, state.history, 'duplicate annotation', (draft) => {
        const current = draft.annotations[index]
        if (current) {
          draft.annotations.splice(index + 1, 0, duplicateAnnotation(current as Annotation))
        }
      })
      return {
        dataset: result.value,
        history: result.history,
        selectedAnnotationIndex: index + 1,
      }
    }),

  addCategory: (name) =>
    set((state) => {
      if (!state.dataset) {
        return {}
      }
      const nextId = state.dataset.categories.reduce((max, item) => Math.max(max, item.id), -1) + 1
      const category: Category = {
        id: nextId,
        name: name.trim() || `class-${nextId}`,
        color: colorForIndex(state.dataset.categories.length),
      }
      const result = applyEdit(state.dataset, state.history, 'add category', (draft) => {
        draft.categories.push(category)
      })
      return { dataset: result.value, history: result.history }
    }),

  updateCategory: (id, patch) =>
    set((state) => {
      if (!state.dataset) {
        return {}
      }
      const result = applyEdit(state.dataset, state.history, 'edit category', (draft) => {
        const index = draft.categories.findIndex((item) => item.id === id)
        const current = draft.categories[index]
        if (current) {
          Object.assign(current, patch)
        }
      })
      return { dataset: result.value, history: result.history }
    }),

  deleteCategory: (id) =>
    set((state) => {
      if (!state.dataset) {
        return {}
      }
      const result = applyEdit(state.dataset, state.history, 'delete category', (draft) => {
        draft.categories = draft.categories.filter((item) => item.id !== id)
        draft.annotations = draft.annotations.filter((item) => item.categoryId !== id)
      })
      return {
        dataset: result.value,
        history: result.history,
        selectedAnnotationIndex: null,
      }
    }),
}))
