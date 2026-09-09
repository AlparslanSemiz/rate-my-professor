import type { SystemHealth } from '../../api/SystemStatusService'

export interface DashboardStats {
  total: number
  active: number
  admins: number
  openReports: number
}

export const EMPTY_DASHBOARD_STATS: DashboardStats = {
  total: 0,
  active: 0,
  admins: 0,
  openReports: 0,
}

/**
 * The counters the backend keeps, so the dashboard no longer reads every user and every bug
 * report to count them itself. A counter it does not serve reads as zero rather than as a
 * crash; the health status is what says the numbers could not be read at all.
 */
export function dashboardStatsFromCounts(counts: Record<string, number>): DashboardStats {
  return {
    total: counts.users ?? 0,
    active: counts.activeUsers ?? 0,
    admins: counts.admins ?? 0,
    openReports: counts.openBugReports ?? 0,
  }
}

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
  DEGRADED: 'The database answered, but a count query failed — counters are unavailable.',
  DOWN: 'The database is unreachable, so counters and the last write cannot be read.',
}
