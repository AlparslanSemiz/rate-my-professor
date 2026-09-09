import { expectArray } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import { toAuditLog } from './auditLogMapper'
import { toLogQueryParams } from './logQueryParams'
import type {
  AuditLogFilters,
  AuditLogPage,
  AuditLogResponse,
  BackendAuditLog,
} from './auditLogTypes'

export class AuditLogReaderService extends HttpService {
  async getLogs(filters: AuditLogFilters = {}, cursor?: string | null): Promise<AuditLogPage> {
    const response = await this.client.get<AuditLogResponse>('/audit-logs', toLogQueryParams(filters, cursor))
    return {
      auditLogs: expectArray<BackendAuditLog>(response, 'auditLogs', 'GET /audit-logs').map(toAuditLog),
      nextCursor: response.nextCursor ?? null,
    }
  }
}
