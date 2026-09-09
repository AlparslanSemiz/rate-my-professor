import { apiClient } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import { toSystemStatus, type SystemStatusResponse } from './systemStatusMapper'
import type { SystemStatus } from './systemStatusTypes'

export { SYSTEM_HEALTH_VALUES } from './systemStatusTypes'
export type { DatabaseStatus, LastWrite, SystemHealth, SystemStatus } from './systemStatusTypes'

export class SystemStatusService extends HttpService {
  async getStatus(): Promise<SystemStatus> {
    const response = await this.client.get<SystemStatusResponse>('/system/status')
    return toSystemStatus(response)
  }
}

export const systemStatusService = new SystemStatusService(apiClient)
