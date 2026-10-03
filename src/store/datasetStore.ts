import { create } from 'zustand'

import type { DatasetModel } from '@/core/model'
import type { DetectionCandidate, DetectedFile } from '@/core/formats/detect'
import type { DatasetHandle } from '@/platform/types'

export type OpenStatus = 'idle' | 'scanning' | 'detecting' | 'ready' | 'parsing' | 'error'

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
  /** Human-readable failure from the last open attempt. */
  error: string | null

  handle: DatasetHandle | null
  dataset: DatasetModel | null
  warnings: string[]
  pending: PendingOpen | null
  currentImageId: number | null

  setStatus(status: OpenStatus): void
  setProgress(progress: number): void
  setError(error: string | null): void
  setPending(pending: PendingOpen | null): void
  setDataset(handle: DatasetHandle, dataset: DatasetModel, warnings: string[]): void
  selectImage(imageId: number | null): void
  close(): void
}

const initialState = {
  status: 'idle' as OpenStatus,
  progress: 0,
  error: null,
  handle: null,
  dataset: null,
  warnings: [] as string[],
  pending: null,
  currentImageId: null,
}

export const useDatasetStore = create<DatasetState>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  setPending: (pending) => set({ pending }),

  setDataset: (handle, dataset, warnings) =>
    set({
      handle,
      dataset,
      warnings,
      currentImageId: dataset.images[0]?.id ?? null,
    }),

  selectImage: (imageId) => set({ currentImageId: imageId }),

  close: () => set({ ...initialState }),
}))
