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

  /**
   * The target comes from the path and the issuer from the auth token, so the body is the
   * message and nothing else.
   */
  warn(userId: string, message: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>(`/users/${userId}/warnings`, { message })
  }

  async getWarnings(userId: string): Promise<Warning[]> {
    const response = await this.client.get<WarningHistoryResponse>(`/users/${userId}/warnings`)
    return expectArray<BackendWarning>(response, 'warnings', 'GET /users/{id}/warnings').map(toWarning)
  }

  /**
   * Corrects the text of a warning that was already issued. The student is not re-notified:
   * the notification went out when the warning was created, so rewording it corrects the
   * record rather than warning again.
   */
  updateWarning(userId: string, warningId: string, message: string): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/users/${userId}/warnings/${warningId}`, { message })
  }

  /** Withdraws a warning that should not have been issued. */
  deleteWarning(userId: string, warningId: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/users/${userId}/warnings/${warningId}`)
  }
}
