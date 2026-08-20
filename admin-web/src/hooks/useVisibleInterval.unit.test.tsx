import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVisibleInterval } from './useVisibleInterval'

const INTERVAL_MS = 15_000

let hidden = false

function setTabHidden(next: boolean) {
  hidden = next
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

function advance(ms: number) {
  return act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('useVisibleInterval', () => {
  beforeEach(() => {
    hidden = false
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    hidden = false
  })

  it('runs the tick once on mount and then on every interval', async () => {
    const tick = vi.fn()
    renderHook(() => useVisibleInterval(tick, INTERVAL_MS))

    expect(tick).toHaveBeenCalledTimes(1)

    await advance(INTERVAL_MS * 2)

    expect(tick).toHaveBeenCalledTimes(3)
  })

  it('stops polling while the tab is hidden', async () => {
    const tick = vi.fn()
    renderHook(() => useVisibleInterval(tick, INTERVAL_MS))
    tick.mockClear()

    setTabHidden(true)
    await advance(INTERVAL_MS * 4)

    expect(tick).not.toHaveBeenCalled()
  })

  it('reads once as soon as the tab is visible again, rather than a full interval later', async () => {
    const tick = vi.fn()
    renderHook(() => useVisibleInterval(tick, INTERVAL_MS))
    setTabHidden(true)
    await advance(INTERVAL_MS * 4)
    tick.mockClear()

    setTabHidden(false)

    // What was on screen is as old as the time spent hidden, so it is read now.
    expect(tick).toHaveBeenCalledTimes(1)

    await advance(INTERVAL_MS)
    expect(tick).toHaveBeenCalledTimes(2)
  })

  it('still runs the first read when the tab is hidden at mount', () => {
    hidden = true
    const tick = vi.fn()
    renderHook(() => useVisibleInterval(tick, INTERVAL_MS))

    expect(tick).toHaveBeenCalledTimes(1)
  })

  it('re-runs immediately when the run key changes, and restarts the interval from there', async () => {
    const tick = vi.fn()
    const { rerender } = renderHook(({ key }: { key: number }) => useVisibleInterval(tick, INTERVAL_MS, key), {
      initialProps: { key: 0 },
    })

    await advance(INTERVAL_MS - 1_000)
    tick.mockClear()

    rerender({ key: 1 })
    expect(tick).toHaveBeenCalledTimes(1)

    // The interval restarted with the re-run, so the leftover 1s of the old one fires nothing.
    await advance(1_000)
    expect(tick).toHaveBeenCalledTimes(1)

    await advance(INTERVAL_MS)
    expect(tick).toHaveBeenCalledTimes(2)
  })

  it('calls the latest tick without restarting the interval when it changes identity', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ tick }: { tick: () => void }) => useVisibleInterval(tick, INTERVAL_MS), {
      initialProps: { tick: first },
    })

    rerender({ tick: second })
    // A restart would have re-run the tick on the spot; it did not.
    expect(second).not.toHaveBeenCalled()

    await advance(INTERVAL_MS)

    expect(second).toHaveBeenCalledTimes(1)
    expect(first).toHaveBeenCalledTimes(1)
  })

  it('stops polling once unmounted', async () => {
    const tick = vi.fn()
    const { unmount } = renderHook(() => useVisibleInterval(tick, INTERVAL_MS))
    unmount()
    tick.mockClear()

    await advance(INTERVAL_MS * 3)
    setTabHidden(false)

    expect(tick).not.toHaveBeenCalled()
  })
})
