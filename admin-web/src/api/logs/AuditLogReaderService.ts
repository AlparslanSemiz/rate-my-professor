import { expectArray, type ApiClient } from './ApiClient'
import { toAuditLog } from './auditLogMapper'
import { toLogQueryParams } from './logQueryParams'
import type {
  AuditLogFilters,
  AuditLogPage,
  AuditLogResponse,
  BackendAuditLog,
} from './auditLogTypes'

export class AuditLogReaderService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getLogs(filters: AuditLogFilters = {}, cursor?: string | null): Promise<AuditLogPage> {
    const response = await this.client.get<AuditLogResponse>('/audit-logs', toLogQueryParams(filters, cursor))
    return {
      auditLogs: expectArray<BackendAuditLog>(response, 'auditLogs', 'GET /audit-logs').map(toAuditLog),
      nextCursor: response.nextCursor ?? null,
    }
  }
}
