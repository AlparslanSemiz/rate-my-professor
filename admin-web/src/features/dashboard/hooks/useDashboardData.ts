import { useQuery } from '@tanstack/react-query'
import { systemStatusService } from '@/api/system'
import { usersService } from '@/api/users'
import {
  EMPTY_DASHBOARD_STATS,
  RECENT_MEMBER_COUNT,
  REFRESH_INTERVAL_MS,
  dashboardActiveRate,
  dashboardReadingError,
  dashboardStatsFromCounts,
  isCompleteReading,
  type DashboardReading,
} from '../dashboardModel'

const LOAD_ERROR_FALLBACK = 'The dashboard could not be refreshed.'
/** Enough to fill the "Newest members" panel, which shows four. */

const dashboardKeys = {
  all: ['dashboard'] as const,
  status: () => [...dashboardKeys.all, 'status'] as const,
  recentUsers: () => [...dashboardKeys.all, 'recent-users'] as const,
}

/**
 * The dashboard is an overview, so a failed refresh keeps the last good numbers rather than
 * blanking the page. It must not keep them *silently*, though: showing zeros because
 * `/system/status` is down states that nobody has signed up, which is a different claim
 * entirely.
 *
 * Two queries rather than one, because they are two reads that fail independently — half the
 * page arriving is a real and useful outcome. Keeping the last good value on a failed refetch
 * is what TanStack already does, which is why there is no longer a `latestRead` ref
 * discarding overtaken responses, and `refetchInterval` replaces the hand-rolled
 * `visibilitychange` and `setInterval`: it pauses while the tab is not visible, and
 * `refetchOnWindowFocus` reads again the moment it comes back.
 */
export function useDashboardData() {
  const status = useQuery({
    queryKey: dashboardKeys.status(),
    queryFn: () => systemStatusService.getStatus(),
    refetchInterval: REFRESH_INTERVAL_MS,
  })

  const recent = useQuery({
    queryKey: dashboardKeys.recentUsers(),
    queryFn: () => usersService.list({ limit: RECENT_MEMBER_COUNT, sort: 'newest' }),
    refetchInterval: REFRESH_INTERVAL_MS,
  })

  // A degraded database answers the request but carries no counters. That is a reading we do
  // not have, not a reading of zero, so the last good numbers stay on screen.
  const counts = status.data?.counts ?? null
  const reading: DashboardReading = {
    counts,
    countsError: status.error,
    usersError: recent.error,
  }

  const stats = counts ? dashboardStatsFromCounts(counts) : EMPTY_DASHBOARD_STATS
  const users = recent.data?.users ?? []

  return {
    users,
    stats,
    activeRate: dashboardActiveRate(stats),
    // `dataUpdatedAt` only moves on a successful read, and this only reads it when both
    // halves came — so the timestamp never vouches for numbers that did not arrive.
    lastUpdated: isCompleteReading(reading)
      ? new Date(Math.max(status.dataUpdatedAt, recent.dataUpdatedAt))
      : null,
    loading: status.isPending || recent.isPending,
    error: dashboardReadingError(reading, LOAD_ERROR_FALLBACK),
    hasData: counts !== null || recent.data !== undefined,
    retry: () => {
      void status.refetch()
      void recent.refetch()
    },
  }
}
