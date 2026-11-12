import type { SystemCounts, SystemHealth } from '@/api/system'
import { getErrorMessage } from '@/utils/getErrorMessage'

/**
 * How many of the newest accounts the dashboard shows.
 *
 * One constant, because it is one decision read from two places: the query asks the backend
 * for exactly this many, and the panel renders exactly this many. They used to be two `4`s in
 * two files, with the coupling written only as prose in a comment.
 */
export const RECENT_MEMBER_COUNT = 4

/**
 * How often the dashboard re-reads itself while it is on screen.
 *
 * Exported because the Help page tells operators this number, and the two must not drift —
 * it used to be written out as prose in `help/content/dashboard.ts` with nothing tying them
 * together.
 */
export const REFRESH_INTERVAL_MS = 15_000

/**
 * What the four cards are called.
 *
 * Written down once because two files say them: the grid renders them, and the Help page
 * explains them. They had already drifted — Help described a card called "Not blocked" that
 * the dashboard has never shown, under a colour the dashboard has never used.
 */
export const DASHBOARD_CARDS = Object.freeze({
  total: 'Total users',
  active: 'Active accounts',
  admins: 'Admin accounts',
  openReports: 'Open reports',
})

/** The four figures across the top of the dashboard, as the cards read them. */
export interface DashboardStats {
  total: number
  active: number
  admins: number
  openReports: number
}

/** Frozen: one object answers every caller that has nothing to show yet. */
export const EMPTY_DASHBOARD_STATS: DashboardStats = Object.freeze({
  total: 0,
  active: 0,
  admins: 0,
  openReports: 0,
})

/**
 * The counters the backend keeps, so the dashboard no longer reads every user and every bug
 * report to count them itself. A counter it does not serve reads as zero rather than as a
 * crash; the health status is what says the numbers could not be read at all.
 */
export function dashboardStatsFromCounts(counts: SystemCounts): DashboardStats {
  return {
    total: counts.users ?? 0,
    active: counts.activeUsers ?? 0,
    admins: counts.admins ?? 0,
    openReports: counts.openBugReports ?? 0,
  }
}

/**
 * @param stats the figures as read
 * @returns the share of accounts that are active, as a percentage, or `null` when there is
 *          no total to divide by — a rate of zero and no reading look identical otherwise
 */
export function dashboardActiveRate({ total, active }: DashboardStats) {
  return total ? Math.round((active / total) * 100) : 0
}

/**
 * Appended to a refresh failure. The dashboard keeps the last good numbers rather than
 * blanking, so the operator has to be told the figures are not current.
 */
export const STALE_READING_SUFFIX = 'Showing the last successful reading.'

/**
 * What each `/system/status` health value means for the counters this page shows. `DEGRADED`
 * is the one that matters here: the request succeeded but carried no counts, which is a
 * reading we do not have rather than a reading of zero.
 *
 * Inherited from the System Status page, which was removed on 2026-08-21; the dashboard is
 * the only screen still reading health.
 */
export const healthDescription: Record<SystemHealth, string> = {
  OK: 'The database answered and the counters were read.',
  DEGRADED: 'The database answered, but a count query failed, so counters are unavailable.',
  DOWN: 'The database is unreachable, so counters and the last write cannot be read.',
}

/** The outcome of one dashboard refresh: two independent reads, either of which may fail. */
export interface DashboardReading {
  /** The counters the status read carried, or `null` if it carried none. */
  counts: SystemCounts | null
  countsError: unknown
  usersError: unknown
}

/**
 * What to tell the operator about a reading.
 *
 * A failed read is reported with its own message, the counters read first because a status
 * failure explains more than a user-list failure. A read that succeeded but carried no
 * counters is the `DEGRADED` case: that is a reading we do not have, not a reading of zero,
 * and saying nothing would leave zeros on screen claiming nobody has signed up.
 */
export function dashboardReadingError(reading: DashboardReading, fallback: string): string {
  const failure = reading.countsError ?? reading.usersError
  if (failure) return getErrorMessage(failure, fallback)
  return reading.counts ? '' : healthDescription.DEGRADED
}

/**
 * Whether both halves arrived. `lastUpdated` is only allowed to move on a complete reading,
 * so the timestamp never vouches for numbers that did not come.
 */
export function isCompleteReading(reading: DashboardReading): boolean {
  return !reading.countsError && !reading.usersError && reading.counts !== null
}
