import { describe, expect, it } from 'vitest'

import { createWebSource, entriesFromRelativePaths } from './web'

describe('entriesFromRelativePaths', () => {
  it('synthesises directory entries and sorts the listing', () => {
    const entries = entriesFromRelativePaths([
      { path: 'train/cat/a.jpg', size: 10 },
      { path: 'train/cat/b.jpg', size: 20 },
    ])

    expect(entries.map((entry) => [entry.path, entry.isDir])).toEqual([
      ['train', true],
      ['train/cat', true],
      ['train/cat/a.jpg', false],
      ['train/cat/b.jpg', false],
    ])
    expect(entries.find((entry) => entry.path === 'train/cat/a.jpg')?.size).toBe(10)
  })

  it('handles files directly in the root', () => {
    const entries = entriesFromRelativePaths([{ path: 'a.jpg', size: 1 }])
    expect(entries).toEqual([{ path: 'a.jpg', isDir: false, size: 1 }])
  })
})

describe('write permission', () => {
  const handle = { id: 'missing', root: '', displayName: 'x' }

  it('reports unsupported for a handle it did not open', async () => {
    const source = createWebSource()
    await expect(source.queryWritePermission(handle)).resolves.toBe('unsupported')
    await expect(source.requestWritePermission(handle)).resolves.toBe(false)
  })
})
