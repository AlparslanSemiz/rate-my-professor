import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'

export const SYSTEM_HEALTH_VALUES = ['OK', 'DEGRADED', 'DOWN'] as const

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
 * `counts` and `lastWrite` are null unless the database answered: a degraded or unreachable
 * database is reported in `status` rather than in the HTTP code, because a page that has to
 * show "the API is up but the database is not" cannot do that if the request itself fails.
 *
 * `counts` is read as an open map so a counter added by the backend renders without a
 * frontend release.
 */
export interface SystemStatus {
  status: SystemHealth
  checkedAt: string
  startedAt: string | null
  uptimeSeconds: number | null
  database: DatabaseStatus
  counts: Record<string, number> | null
  lastWrite: LastWrite | null
  /**
   * Whether the backend holds GitLab credentials. False until the operator supplies them,
   * and the issue endpoint answers `503` while it is — so the control is hidden on this flag
   * rather than discovered by pressing it.
   */
  gitlabEnabled: boolean
}

interface SystemStatusResponse extends BasicResponse, SystemStatus {}

export class SystemStatusService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getStatus(): Promise<SystemStatus> {
    const response = await this.client.get<SystemStatusResponse>('/system/status')
    return {
      status: response.status,
      checkedAt: response.checkedAt,
      startedAt: response.startedAt ?? null,
      uptimeSeconds: response.uptimeSeconds ?? null,
      database: response.database,
      counts: response.counts ?? null,
      lastWrite: response.lastWrite ?? null,
      gitlabEnabled: response.gitlabEnabled ?? false,
    }
  }
}

export const systemStatusService = new SystemStatusService(apiClient)
