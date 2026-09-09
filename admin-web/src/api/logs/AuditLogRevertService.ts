import type { BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'

/** Undoing a single recorded field edit. */
export class AuditLogRevertService extends HttpService {
  /**
   * Undoes the field edit an entry recorded. The caller must re-read the log afterwards:
   * that is where the reversal's own entry appears.
   */
  revert(id: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>(`/audit-logs/${id}/revert`)
  }
}
