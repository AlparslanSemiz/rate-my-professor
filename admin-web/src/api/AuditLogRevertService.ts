import type { ApiClient, BasicResponse } from './ApiClient'

export class AuditLogRevertService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  /**
   * Undoes the field edit an entry recorded. The caller must re-read the log afterwards:
   * that is where the reversal's own entry appears.
   */
  revert(id: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>(`/audit-logs/${id}/revert`)
  }
}
