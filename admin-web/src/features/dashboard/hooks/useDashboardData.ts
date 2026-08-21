import { useCallback, useRef, useState } from 'react'
import { systemStatusService } from '../../../api/SystemStatusService'
import { usersService, type User } from '../../../api/UsersService'
import { useVisibleInterval } from '../../../hooks/useVisibleInterval'
import { getErrorMessage } from '../../../utils/getErrorMessage'
import { healthDescription } from '../dashboardModel'

export interface DashboardStats {
  total: number
  active: number
  admins: number
  openReports: number
}

const REFRESH_INTERVAL_MS = 15_000
const LOAD_ERROR_FALLBACK = 'The dashboard could not be refreshed.'
/** Enough to fill the "Newest members" panel, which shows four. */
const RECENT_USER_LIMIT = 4

const EMPTY_STATS: DashboardStats = { total: 0, active: 0, admins: 0, openReports: 0 }

/**
 * The counters the backend keeps, so the dashboard no longer reads every user and every bug
 * report to count them itself. A counter it does not serve reads as zero rather than as a
 * crash; the health status is what says the numbers could not be read at all.
 */
function toStats(counts: Record<string, number>): DashboardStats {
  return {
    total: counts.users ?? 0,
    active: counts.activeUsers ?? 0,
    admins: counts.admins ?? 0,
    openReports: counts.openBugReports ?? 0,
  }
}

function calculateActiveRate({ total, active }: DashboardStats) {
  return total ? Math.round((active / total) * 100) : 0
}

function firstFailure(results: PromiseSettledResult<unknown>[]): unknown {
  return results.find((result) => result.status === 'rejected')?.reason ?? null
}

/**
 * The dashboard is an overview, so a failed refresh keeps the last good numbers rather than
 * blanking the page. It must not keep them *silently*, though: showing zeros because
 * `/system/status` is down states that nobody has signed up, which is a different claim
 * entirely. `lastUpdated` only moves on a fully successful read, so the timestamp never
 * vouches for numbers that did not arrive.
 */
export function useDashboardData() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [hasData, setHasData] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  // Which read is allowed to write to the screen. Every read bumps it as it starts, so when
  // a retry or a poll fires while the previous one is still in flight, the older response is
  // discarded instead of landing on top of the newer one.
  const latestRead = useRef(0)

  const refresh = useCallback(async () => {
    const read = ++latestRead.current
    const results = await Promise.allSettled([
      systemStatusService.getStatus(),
      usersService.list({ limit: RECENT_USER_LIMIT, sort: 'newest' }),
    ])
    if (read !== latestRead.current) return

    const [statusResult, recentResult] = results
    // A degraded database answers the request but carries no counters. That is a reading we
    // do not have, not a reading of zero, so the last good numbers stay on screen.
    const counts = statusResult.status === 'fulfilled' ? statusResult.value.counts : null
    if (counts) setStats(toStats(counts))
    if (recentResult.status === 'fulfilled') setUsers(recentResult.value.users)
    if (counts || recentResult.status === 'fulfilled') setHasData(true)

    const failure = firstFailure(results)
    if (failure !== null) {
      setError(getErrorMessage(failure, LOAD_ERROR_FALLBACK))
    } else if (!counts) {
      setError(healthDescription.DEGRADED)
    } else {
      setLastUpdated(new Date())
      setError('')
    }
    setLoading(false)
  }, [])

  useVisibleInterval(() => void refresh(), REFRESH_INTERVAL_MS, reloadKey)

  const retry = useCallback(() => {
    setLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }, [])

  return {
    users,
    stats,
    activeRate: calculateActiveRate(stats),
    lastUpdated,
    loading,
    error,
    hasData,
    retry,
  }
}
