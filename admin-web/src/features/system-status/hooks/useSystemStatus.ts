import { useCallback, useEffect, useState } from 'react'
import { systemStatusService, type SystemStatus } from '../../../api/SystemStatusService'
import { getSystemStatusErrorMessage } from '../systemStatusModel'

const REFRESH_INTERVAL_MS = 15_000
const LOAD_ERROR_FALLBACK = 'Failed to read the backend status'

/**
 * Polls `/system/status` so an admin can watch a counter move right after performing an
 * action. A failed refresh keeps the last successful snapshot on screen; the page decides
 * whether the error blocks it or is only a staleness warning.
 */
export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function read(manual: boolean) {
      if (manual) setRefreshing(true)
      try {
        const next = await systemStatusService.getStatus()
        if (cancelled) return
        setStatus(next)
        setError('')
      } catch (readError: unknown) {
        if (!cancelled) setError(getSystemStatusErrorMessage(readError, LOAD_ERROR_FALLBACK))
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void read(reloadKey > 0)
    const interval = setInterval(() => void read(false), REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [reloadKey])

  const refresh = useCallback(() => {
    setReloadKey((key) => key + 1)
  }, [])

  return { status, loading, refreshing, error, refresh }
}
