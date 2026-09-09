import { expectArray } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { AuditAction, AuditMeta, AuditMetaResponse, AuditTargetType } from './auditLogTypes'

export class AuditLogMetaService extends HttpService {
  async getMeta(): Promise<AuditMeta> {
    const response = await this.client.get<AuditMetaResponse>('/audit-logs/meta')
    return {
      actors: expectArray<AuditMeta['actors'][number]>(response, 'actors', 'GET /audit-logs/meta'),
      actions: expectArray<AuditAction>(response, 'actions', 'GET /audit-logs/meta'),
      targetTypes: expectArray<AuditTargetType>(response, 'targetTypes', 'GET /audit-logs/meta'),
      actorTypes: response.actorTypes ?? [],
    }
  }
}
