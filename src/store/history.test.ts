import { describe, expect, it } from 'vitest'

import { applyEdit, emptyHistory, redoEdit, undoEdit } from './history'

interface Doc {
  items: number[]
}

describe('edit history', () => {
  it('records an edit and can undo and redo it', () => {
    const start: Doc = { items: [] }
    const added = applyEdit(start, emptyHistory, 'add', (draft) => {
      draft.items.push(1)
    })
    expect(added.value.items).toEqual([1])
    expect(added.history.past).toHaveLength(1)

    const undone = undoEdit(added.value, added.history)
    expect(undone.value.items).toEqual([])
    expect(undone.history.future).toHaveLength(1)

    const redone = redoEdit(undone.value, undone.history)
    expect(redone.value.items).toEqual([1])
  })

  it('clears the redo stack when a new edit arrives', () => {
    let doc: Doc = { items: [] }
    let history = emptyHistory

    const first = applyEdit(doc, history, 'a', (draft) => {
      draft.items.push(1)
    })
    doc = first.value
    history = first.history

    const undone = undoEdit(doc, history)
    doc = undone.value
    history = undone.history

    const second = applyEdit(doc, history, 'b', (draft) => {
      draft.items.push(2)
    })
    expect(second.history.future).toHaveLength(0)
    expect(second.value.items).toEqual([2])
  })

  it('treats a no-op mutation as no history entry', () => {
    const doc: Doc = { items: [1] }
    const result = applyEdit(doc, emptyHistory, 'noop', () => undefined)
    expect(result.value).toBe(doc)
    expect(result.history.past).toHaveLength(0)
  })
})
