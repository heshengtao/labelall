import { applyPatches, enablePatches, produceWithPatches, type Draft, type Patch } from 'immer'

enablePatches()

export interface HistoryEntry {
  label: string
  patches: Patch[]
  inverse: Patch[]
}

export interface History {
  past: HistoryEntry[]
  future: HistoryEntry[]
}

export const emptyHistory: History = { past: [], future: [] }

export interface EditResult<T> {
  value: T
  history: History
}

/** Apply a mutation, recording it on the undo stack and clearing redo. */
export function applyEdit<T extends object>(
  value: T,
  history: History,
  label: string,
  recipe: (draft: Draft<T>) => void,
): EditResult<T> {
  const [next, patches, inverse] = produceWithPatches(value, recipe)
  if (patches.length === 0) {
    return { value, history }
  }
  return {
    value: next,
    history: { past: [...history.past, { label, patches, inverse }], future: [] },
  }
}

export function undoEdit<T extends object>(value: T, history: History): EditResult<T> {
  const entry = history.past.at(-1)
  if (!entry) {
    return { value, history }
  }
  return {
    value: applyPatches(value, entry.inverse),
    history: { past: history.past.slice(0, -1), future: [entry, ...history.future] },
  }
}

export function redoEdit<T extends object>(value: T, history: History): EditResult<T> {
  const entry = history.future[0]
  if (!entry) {
    return { value, history }
  }
  return {
    value: applyPatches(value, entry.patches),
    history: { past: [...history.past, entry], future: history.future.slice(1) },
  }
}
