import { expectArray } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { HttpTransport } from '@/api/client/httpTransport'
import type { LogResource } from './logResource'
import type { AuditAction, AuditMeta, AuditTargetType } from '@/domain/auditLog'
import type { LogMetaResponse } from './logTypes'

/** The filter vocabulary: what the dropdowns above one of the two logs may offer. */
export class LogMetaService extends HttpService {
  private readonly resource: LogResource

  constructor(client: HttpTransport, resource: LogResource) {
    super(client)
    this.resource = resource
  }

  /**
   * `actorTypes` is defaulted rather than demanded: a backend that predates the field offers
   * no actor-type filter instead of failing the whole read.
   *
   * @returns the vocabulary, with `actors` capped by the backend rather than exhaustive
   * @throws {ContractError} when any of the three required lists is missing
   */
  async getMeta(): Promise<AuditMeta> {
    const path = `${this.resource.path}/meta`
    const response = await this.client.get<LogMetaResponse>(path)
    return {
      actors: expectArray<AuditMeta['actors'][number]>(response, 'actors', `GET ${path}`),
      actions: expectArray<AuditAction>(response, 'actions', `GET ${path}`),
      targetTypes: expectArray<AuditTargetType>(response, 'targetTypes', `GET ${path}`),
      actorTypes: response.actorTypes ?? [],
    }
  }
}
