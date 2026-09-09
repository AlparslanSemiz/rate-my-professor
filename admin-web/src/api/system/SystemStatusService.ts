import { apiClient, type ApiClient } from './ApiClient'
import { toSystemStatus, type SystemStatusResponse } from './systemStatusMapper'
import type { SystemStatus } from './systemStatusTypes'

export { SYSTEM_HEALTH_VALUES } from './systemStatusTypes'
export type { DatabaseStatus, LastWrite, SystemHealth, SystemStatus } from './systemStatusTypes'

export class SystemStatusService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getStatus(): Promise<SystemStatus> {
    const response = await this.client.get<SystemStatusResponse>('/system/status')
    return toSystemStatus(response)
  }
}

export const systemStatusService = new SystemStatusService(apiClient)
