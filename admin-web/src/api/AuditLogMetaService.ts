import { expectArray, type ApiClient } from './ApiClient'
import type { AuditAction, AuditMeta, AuditMetaResponse, AuditTargetType } from './auditLogTypes'

export class AuditLogMetaService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

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
