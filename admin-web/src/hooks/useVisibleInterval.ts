import { useEffect, useRef } from 'react'

/**
 * Runs `tick` once on mount, then every `intervalMs` — but only while the tab is visible, and
 * once more the moment it becomes visible again.
 *
 * A background tab that keeps polling spends a request per interval on a screen nobody is
 * looking at, and the panel polls two of them. Stopping is only half of it: without the fire
 * on becoming visible, the first thing the admin sees on coming back is up to a full interval
 * old, which is worse than the tab that never stopped.
 *
 * `runKey` re-runs `tick` immediately when it changes and restarts the interval from there —
 * a retry, for instance, so the next automatic read is a full interval away rather than
 * whatever was left of the previous one.
 *
 * `tick` is read through a ref, so a caller passing a fresh closure on every render neither
 * restarts the interval nor has to memoise it.
 */
export function useVisibleInterval(tick: () => void, intervalMs: number, runKey: unknown = 0) {
  const latestTick = useRef(tick)

  useEffect(() => {
    latestTick.current = tick
  })

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null

    function stop() {
      if (timer === null) return
      clearInterval(timer)
      timer = null
    }

    function start() {
      if (timer === null) timer = setInterval(() => latestTick.current(), intervalMs)
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stop()
        return
      }
      latestTick.current()
      start()
    }

    // The first read happens whether or not the tab is visible: the caller has just mounted
    // and has nothing to show yet. Only the *repeat* is conditional.
    latestTick.current()
    if (!document.hidden) start()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [intervalMs, runKey])
}
