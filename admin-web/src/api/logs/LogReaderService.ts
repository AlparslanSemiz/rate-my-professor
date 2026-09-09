import { expectArray } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { HttpTransport } from '@/api/client/httpTransport'
import { toLogQueryParams } from './logQueryParams'
import type { LogResource } from './logResource'
import type { AuditEntry, AuditLogFilters } from '@/domain/auditLog'
import type { BackendLogEntry, LogPage, LogResponse } from './logTypes'

/**
 * Reading pages of one of the two logs.
 *
 * Generic over the entry because the audit half carries three fields the activity half does
 * not, and over the resource because the path and the response key are the only other thing
 * that differs. The mapper is passed in rather than chosen here: deciding which defaults an
 * entry gets is the caller's, and a reader that picked would have to know which log it is —
 * which is exactly the knowledge {@link LogResource} exists to hold instead.
 */
export class LogReaderService<TEntry extends AuditEntry> extends HttpService {
  private readonly resource: LogResource
  private readonly toEntry: (entry: BackendLogEntry) => TEntry

  constructor(
    client: HttpTransport,
    resource: LogResource,
    toEntry: (entry: BackendLogEntry) => TEntry,
  ) {
    super(client)
    this.resource = resource
    this.toEntry = toEntry
  }

  /**
   * @param filters what to narrow on
   * @param cursor the cursor from the previous page, or absent for the first
   * @returns the page, each entry filled in by the mapper this reader was built with
   * @throws {ContractError} when the response holds no list under this log's own key
   */
  async getLogs(filters: AuditLogFilters = {}, cursor?: string | null): Promise<LogPage<TEntry>> {
    const { path, listKey } = this.resource
    const response = await this.client.get<LogResponse>(path, toLogQueryParams(filters, cursor))
    return {
      entries: expectArray<BackendLogEntry>(response, listKey, `GET ${path}`).map(this.toEntry),
      nextCursor: response.nextCursor ?? null,
    }
  }
}
