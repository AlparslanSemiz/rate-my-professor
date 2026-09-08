import { expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import { toWarning, type BackendWarning } from './userWarningMapper'
import type { Warning } from './userTypes'

interface WarningHistoryResponse extends BasicResponse {
  warnings: BackendWarning[]
}

export class UserWarningsService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  warn(userId: string, message: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>(`/users/${userId}/warnings`, { message })
  }

  async getWarnings(userId: string): Promise<Warning[]> {
    const response = await this.client.get<WarningHistoryResponse>(`/users/${userId}/warnings`)
    return expectArray<BackendWarning>(response, 'warnings', 'GET /users/{id}/warnings').map(toWarning)
  }

  updateWarning(userId: string, warningId: string, message: string): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/users/${userId}/warnings/${warningId}`, { message })
  }

  deleteWarning(userId: string, warningId: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/users/${userId}/warnings/${warningId}`)
  }
}
