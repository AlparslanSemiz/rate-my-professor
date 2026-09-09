import { expectArray } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { AuditAction, AuditMeta, AuditTargetType } from '@/domain/auditLog'
import type { AuditMetaResponse } from './auditLogTypes'

/** The filter vocabulary: what the dropdowns above the log may offer. */
export class AuditLogMetaService extends HttpService {
  /**
   * `actorTypes` is defaulted rather than demanded: a backend that predates the field offers
   * no actor-type filter instead of failing the whole read.
   *
   * @returns the vocabulary, with `actors` capped by the backend rather than exhaustive
   * @throws {ContractError} when any of the three required lists is missing
   */
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
