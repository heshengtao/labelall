import { create } from 'zustand'

export type ViewMode = 'grid' | 'viewer'

/** The active drawing tool in the viewer. */
export type EditorTool = 'select' | 'bbox' | 'polygon' | 'keypoint'

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
  tool: EditorTool
  /** Category new annotations are created with. */
  activeCategoryId: number | null
  /** Whether the categories panel is open. */
  categoriesOpen: boolean
  /** Whether the shortcuts dialog is open. */
  helpOpen: boolean

  setViewMode(mode: ViewMode): void
  toggleLayer(layer: keyof LayerVisibility): void
  setTool(tool: EditorTool): void
  setActiveCategory(categoryId: number | null): void
  setCategoriesOpen(open: boolean): void
  setHelpOpen(open: boolean): void
}

export const useUiStore = create<UiState>((set) => ({
  viewMode: 'grid',
  layers: { bbox: true, polygon: true, keypoint: true, mask: true },
  tool: 'select',
  activeCategoryId: null,
  categoriesOpen: false,
  helpOpen: false,

  setViewMode: (viewMode) => set({ viewMode }),
  toggleLayer: (layer) =>
    set((state) => ({ layers: { ...state.layers, [layer]: !state.layers[layer] } })),
  setTool: (tool) => set({ tool }),
  setActiveCategory: (activeCategoryId) => set({ activeCategoryId }),
  setCategoriesOpen: (categoriesOpen) => set({ categoriesOpen }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
}))
