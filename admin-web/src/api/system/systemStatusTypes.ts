/** Overall health, as the backend judges it from its own probes. */
export const SYSTEM_HEALTH_VALUES = ['OK', 'DEGRADED', 'DOWN'] as const

/** One of {@link SYSTEM_HEALTH_VALUES}. */
export type SystemHealth = (typeof SYSTEM_HEALTH_VALUES)[number]

/**
 * Result of the readiness probe against the database. `latencyMs` is the `SELECT 1` round
 * trip, and `error` names the failure class when the probe did not answer.
 */
export interface DatabaseStatus {
  reachable: boolean
  latencyMs: number | null
  error: string | null
}

/**
 * The newest persisted audit event. This is what answers "did the action I just took actually
 * reach the database". Absent when nothing has been recorded yet.
 */
export interface LastWrite {
  at: string
  ageSeconds: number
  action: string
  actorName: string
}

/**
 * The counters the panel reads, lifted out of the open map the backend serves them in.
 *
 * The wire names — `users`, `activeUsers`, `admins`, `openBugReports` — used to be spelled out
 * in two feature modules that knew nothing about each other, with different defaults and with
 * `openBugReports` known to only one of them. A rename by the backend broke two features, and
 * neither of them lived in this package.
 *
 * Each counter is `null` when the backend did not serve it. What to *show* for a missing
 * counter is the screen's decision and stays with the screen: the users table draws a dash,
 * the dashboard draws a zero.
 */
export interface SystemCounts {
  readonly users: number | null
  readonly activeUsers: number | null
  readonly admins: number | null
  readonly openBugReports: number | null
}

/**
 * `counts` and `lastWrite` are null unless the database answered: a degraded or unreachable
 * database is reported in `status` rather than in the HTTP code, because a page that has to
 * show "the API is up but the database is not" cannot do that if the request itself fails.
 *
 * `counts` arrives as an open map and is narrowed to {@link SystemCounts} here, so that the
 * counter names are written down once.
 */
export interface SystemStatus {
  status: SystemHealth
  checkedAt: string
  startedAt: string | null
  uptimeSeconds: number | null
  database: DatabaseStatus
  counts: SystemCounts | null
  lastWrite: LastWrite | null
  /**
   * Whether the backend holds GitLab credentials. False until the operator supplies them,
   * and the issue endpoint answers `503` while it is — so the control is hidden on this flag
   * rather than discovered by pressing it.
   */
  gitlabEnabled: boolean
}
