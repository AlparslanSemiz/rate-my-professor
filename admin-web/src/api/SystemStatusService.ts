import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'

export const SYSTEM_HEALTH_VALUES = ['OK', 'DEGRADED', 'DOWN'] as const

export type SystemHealth = (typeof SYSTEM_HEALTH_VALUES)[number]
export type DependencyHealth = 'UP' | 'DOWN'

export interface DatabaseStatus {
  status: DependencyHealth
  latencyMs: number | null
  pendingMigrations: number | null
}

/**
 * Counters and last-write timestamps are open maps rather than fixed fields so the page
 * renders whatever the backend reports. Keys are SCREAMING_SNAKE_CASE or camelCase names
 * that the UI turns into labels.
 */
export interface SystemStatus {
  status: SystemHealth
  checkedAt: string
  version: string | null
  uptimeSeconds: number | null
  database: DatabaseStatus
  counts: Record<string, number>
  lastWriteAt: Record<string, string | null>
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
      version: response.version ?? null,
      uptimeSeconds: response.uptimeSeconds ?? null,
      database: response.database,
      counts: response.counts ?? {},
      lastWriteAt: response.lastWriteAt ?? {},
    }
  }
}

export const systemStatusService = new SystemStatusService(apiClient)
