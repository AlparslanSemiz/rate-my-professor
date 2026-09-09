import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
import { AuditLogMetaService } from './AuditLogMetaService'
import { AuditLogReaderService } from './AuditLogReaderService'
import { AuditLogRevertService } from './AuditLogRevertService'
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES, type AuditLogFilters, type AuditLogPage, type AuditMeta } from './auditLogTypes'

export { AUDIT_ACTIONS, AUDIT_TARGET_TYPES }
export type {
  AuditAction,
  AuditActor,
  AuditActorType,
  AuditChange,
  AuditLog,
  AuditLogFilters,
  AuditLogPage,
  AuditMeta,
  AuditTarget,
  AuditTargetType,
  AuditValue,
  BackendAuditLog,
} from './auditLogTypes'

export class AuditLogsService {
  private readonly reader: AuditLogReaderService
  private readonly metadata: AuditLogMetaService
  private readonly reverter: AuditLogRevertService

  constructor(client: ApiClient) {
    this.reader = new AuditLogReaderService(client)
    this.metadata = new AuditLogMetaService(client)
    this.reverter = new AuditLogRevertService(client)
  }

  async getLogs(filters: AuditLogFilters = {}, cursor?: string | null): Promise<AuditLogPage> {
    return this.reader.getLogs(filters, cursor)
  }

  revert(id: string): Promise<BasicResponse> {
    return this.reverter.revert(id)
  }

  async getMeta(): Promise<AuditMeta> {
    return this.metadata.getMeta()
  }
}

export const auditLogsService = new AuditLogsService(apiClient)
