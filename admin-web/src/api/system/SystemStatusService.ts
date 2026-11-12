import { apiClient } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import { toSystemStatus, type SystemStatusResponse } from './systemStatusMapper'
import type { SystemStatus } from './systemStatusTypes'

export { SYSTEM_HEALTH_VALUES } from './systemStatusTypes'
export type { DatabaseStatus, LastWrite, SystemHealth, SystemStatus } from './systemStatusTypes'

/**
 * The counters and health readings behind the dashboard.
 *
 * There is no System Status *screen* — see ADR 0003 — but the endpoint stays, because the
 * dashboard's totals come from it. Counting fifty-row pages into a total is not possible.
 */
export class SystemStatusService extends HttpService {
  /**
   * @returns the reading, with `counts` and `lastWrite` null when the database did not answer
   * @throws {ResponseError} only when the API itself failed — a database that is down is
   *         reported *in* the payload, so the page can say "the API is up and the database
   *         is not" instead of failing the request
   */
  async getStatus(): Promise<SystemStatus> {
    const response = await this.client.get<SystemStatusResponse>('/system/status')
    return toSystemStatus(response)
  }
}

/** The panel's system-status service, bound to the shared client. */
export const systemStatusService = new SystemStatusService(apiClient)
