import { expectArray } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import { toAuditLog } from './auditLogMapper'
import { toLogQueryParams } from './logQueryParams'
import type { AuditLogFilters } from '@/domain/auditLog'
import type { AuditLogPage, AuditLogResponse, BackendAuditLog } from './auditLogTypes'

/** Reading pages of the log. */
export class AuditLogReaderService extends HttpService {
  /**
   * @param filters what to narrow on
   * @param cursor the cursor from the previous page, or absent for the first
   * @returns the page, each entry filled in by `toAuditLog`
   * @throws {ContractError} when the response holds no `auditLogs` list
   */
  async getLogs(filters: AuditLogFilters = {}, cursor?: string | null): Promise<AuditLogPage> {
    const response = await this.client.get<AuditLogResponse>('/audit-logs', toLogQueryParams(filters, cursor))
    return {
      auditLogs: expectArray<BackendAuditLog>(response, 'auditLogs', 'GET /audit-logs').map(toAuditLog),
      nextCursor: response.nextCursor ?? null,
    }
  }
}
