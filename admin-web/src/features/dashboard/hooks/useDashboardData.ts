import { useCallback, useRef, useState } from 'react'
import { feedbackService, type BugReport } from '../../../api/FeedbackService'
import { usersService, type User } from '../../../api/UsersService'
import { useVisibleInterval } from '../../../hooks/useVisibleInterval'
import { getErrorMessage } from '../../../utils/getErrorMessage'

export interface DashboardStats {
  total: number
  active: number
  admins: number
  openReports: number
  totalReports: number
}

const REFRESH_INTERVAL_MS = 15_000
const LOAD_ERROR_FALLBACK = 'The dashboard could not be refreshed.'

function countOpenReports(reports: { status: string }[]) {
  return reports.filter((report) => report.status === 'OPEN').length
}

function calculateDashboardStats(
  users: User[],
  openReports: number,
  totalReports: number,
): DashboardStats {
  return {
    total: users.length,
    active: users.filter((user) => user.status === 'ACTIVE').length,
    admins: users.filter((user) => user.role === 'ADMIN').length,
    openReports,
    totalReports,
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
 * `/users` is down states that nobody has signed up, which is a different claim entirely.
 * `lastUpdated` only moves on a fully successful read, so the timestamp never vouches for
 * numbers that did not arrive.
 */
export function useDashboardData() {
  const [users, setUsers] = useState<User[]>([])
  const [reports, setReports] = useState<BugReport[]>([])
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
      usersService.getAll(),
      feedbackService.getReports(),
    ])
    if (read !== latestRead.current) return

    const [usersResult, reportsResult] = results
    if (usersResult.status === 'fulfilled') setUsers(usersResult.value)
    if (reportsResult.status === 'fulfilled') setReports(reportsResult.value)
    if (usersResult.status === 'fulfilled' || reportsResult.status === 'fulfilled') {
      setHasData(true)
    }

    const failure = firstFailure(results)
    if (failure === null) {
      setLastUpdated(new Date())
      setError('')
    } else {
      setError(getErrorMessage(failure, LOAD_ERROR_FALLBACK))
    }
    setLoading(false)
  }, [])

  useVisibleInterval(() => void refresh(), REFRESH_INTERVAL_MS, reloadKey)

  const retry = useCallback(() => {
    setLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }, [])

  const stats = calculateDashboardStats(users, countOpenReports(reports), reports.length)
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
