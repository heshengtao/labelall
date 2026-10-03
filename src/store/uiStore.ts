import { create } from 'zustand'

export type ViewMode = 'grid' | 'viewer'

/** Which annotation layers the viewer draws. */
export interface LayerVisibility {
  bbox: boolean
  polygon: boolean
  keypoint: boolean
  mask: boolean
}

interface UiState {
  viewMode: ViewMode
  layers: LayerVisibility
  setViewMode(mode: ViewMode): void
  toggleLayer(layer: keyof LayerVisibility): void
}

export const useUiStore = create<UiState>((set) => ({
  viewMode: 'grid',
  layers: { bbox: true, polygon: true, keypoint: true, mask: true },

  setViewMode: (viewMode) => set({ viewMode }),

  toggleLayer: (layer) =>
    set((state) => ({ layers: { ...state.layers, [layer]: !state.layers[layer] } })),
}))
