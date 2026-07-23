import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsyncData } from './useAsyncData'

describe('useAsyncData', () => {
  it('loads data and exposes it to the caller', async () => {
    const load = vi.fn().mockResolvedValue(['first', 'second'])

    const { result } = renderHook(() => useAsyncData(load, [] as string[], 'Could not load'))

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(['first', 'second'])
    expect(result.current.error).toBe('')
  })

  it('shows the fallback error and retries the request', async () => {
    const load = vi.fn()
      .mockRejectedValueOnce(null)
      .mockResolvedValueOnce(['recovered'])

    const { result } = renderHook(() => useAsyncData(load, [] as string[], 'Could not load'))

    await waitFor(() => expect(result.current.error).toBe('Could not load'))

    act(() => result.current.retry())

    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe('')
    await waitFor(() => expect(result.current.data).toEqual(['recovered']))
    expect(result.current.loading).toBe(false)
    expect(load).toHaveBeenCalledTimes(2)
  })
})
