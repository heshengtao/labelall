import { beforeEach, describe, expect, it, vi } from 'vitest'

const platform = vi.hoisted(() => ({
  queryWritePermission: vi.fn(),
  requestWritePermission: vi.fn(),
}))

vi.mock('@/platform', () => ({
  getDatasetSource: () => ({
    queryWritePermission: platform.queryWritePermission,
    requestWritePermission: platform.requestWritePermission,
  }),
}))

import type { DatasetHandle } from '@/platform/types'

import { useWriteAccessStore } from './writeAccessStore'

const handle: DatasetHandle = { id: 'h', root: '/x', displayName: 'x' }

beforeEach(() => {
  platform.queryWritePermission.mockReset()
  platform.requestWritePermission.mockReset()
  useWriteAccessStore.setState({ permission: 'granted', checking: false, requesting: false })
})

describe('writeAccessStore', () => {
  it('reflects the permission the platform reports', async () => {
    platform.queryWritePermission.mockResolvedValue('prompt')
    await useWriteAccessStore.getState().refresh(handle)
    expect(useWriteAccessStore.getState().permission).toBe('prompt')
  })

  it('reports unsupported when no dataset is open', async () => {
    await useWriteAccessStore.getState().refresh(null)
    expect(useWriteAccessStore.getState().permission).toBe('unsupported')
    expect(platform.queryWritePermission).not.toHaveBeenCalled()
  })

  it('falls back to unsupported when the query throws', async () => {
    platform.queryWritePermission.mockRejectedValue(new Error('nope'))
    await useWriteAccessStore.getState().refresh(handle)
    expect(useWriteAccessStore.getState().permission).toBe('unsupported')
  })

  it('upgrades to granted after a successful request', async () => {
    useWriteAccessStore.setState({ permission: 'prompt' })
    platform.requestWritePermission.mockResolvedValue(true)

    await expect(useWriteAccessStore.getState().request(handle)).resolves.toBe(true)

    expect(useWriteAccessStore.getState().permission).toBe('granted')
    expect(platform.requestWritePermission).toHaveBeenCalledWith(handle)
  })

  it('keeps the permission when the request is denied', async () => {
    useWriteAccessStore.setState({ permission: 'prompt' })
    platform.requestWritePermission.mockResolvedValue(false)

    await expect(useWriteAccessStore.getState().request(handle)).resolves.toBe(false)

    expect(useWriteAccessStore.getState().permission).toBe('prompt')
  })
})
