import type { SystemHealth } from '../../api/SystemStatusService'

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
