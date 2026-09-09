import type { BasicResponse } from '@/api/client/ApiClient'
import type { SystemStatus } from './systemStatusTypes'

export interface SystemStatusResponse extends BasicResponse, SystemStatus {}

export function toSystemStatus(response: SystemStatusResponse): SystemStatus {
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
