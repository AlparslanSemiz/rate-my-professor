import type { ApiClient, BasicResponse } from './ApiClient'

export class AuditLogRevertService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  revert(id: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>(`/audit-logs/${id}/revert`)
  }
}
