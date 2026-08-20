import { useCallback, useRef, useState } from 'react'
import { systemStatusService, type SystemStatus } from '../../../api/SystemStatusService'
import { useVisibleInterval } from '../../../hooks/useVisibleInterval'
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
  // Which read is allowed to write to the screen; see the same guard in `useDashboardData`.
  const latestRead = useRef(0)

  const read = useCallback(async () => {
    const attempt = ++latestRead.current
    try {
      const next = await systemStatusService.getStatus()
      if (attempt !== latestRead.current) return
      setStatus(next)
      setError('')
    } catch (readError: unknown) {
      if (attempt === latestRead.current) {
        setError(getSystemStatusErrorMessage(readError, LOAD_ERROR_FALLBACK))
      }
    } finally {
      if (attempt === latestRead.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useVisibleInterval(() => void read(), REFRESH_INTERVAL_MS, reloadKey)

  // `refreshing` is set here rather than inside `read`, so only the button the admin pressed
  // shows a spinner — a poll landing at the same moment does not.
  const refresh = useCallback(() => {
    setRefreshing(true)
    setReloadKey((key) => key + 1)
  }, [])

  return { status, loading, refreshing, error, refresh }
}
