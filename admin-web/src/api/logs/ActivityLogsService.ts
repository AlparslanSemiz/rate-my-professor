import { apiClient, type HttpTransport } from '@/api/client/ApiClient'
import { LogMetaService } from './LogMetaService'
import { LogReaderService } from './LogReaderService'
import { toLogEntry } from './logMapper'
import { ACTIVITY_LOG_RESOURCE } from './logResource'
import type { AuditEntry, AuditLogFilters, AuditMeta } from '@/domain/auditLog'
import type { LogPage } from './logTypes'

/**
 * The activity half of the log table: what students did in the app, plus every refused
 * request. Same entry shape, cursor contract and query parameters as `/audit-logs`; only the
 * action vocabulary differs, and the filter dropdowns take it from `/activity-logs/meta`.
 *
 * **Two services, not three.** There is no reverter here and there is no room for one: these
 * entries are creations, sign-ins and refusals, none of which the backend will undo, and
 * `AuditEntry` carries no `revertible` for a screen to read. That absence is the difference
 * between the two logs, and it is expressed by what this class does not have.
 */
export class ActivityLogsService {
  private readonly reader: LogReaderService<AuditEntry>
  private readonly metadata: LogMetaService

  constructor(client: HttpTransport) {
    this.reader = new LogReaderService(client, ACTIVITY_LOG_RESOURCE, toLogEntry)
    this.metadata = new LogMetaService(client, ACTIVITY_LOG_RESOURCE)
  }

  /**
   * One page of the log, newest first.
   *
   * @param filters what to narrow on; an omitted field is not sent
   * @param cursor the cursor from the previous page, or absent for the first
   * @returns the page and the cursor for the next one, `null` on the last
   * @throws {NotFoundError} when the backend has no activity endpoints deployed at all — the
   *         panel says so rather than reporting "no entries"
   * @throws {ContractError} when the response holds no `activityLogs` list
   */
  async getLogs(filters: AuditLogFilters = {}, cursor?: string | null): Promise<LogPage<AuditEntry>> {
    return this.reader.getLogs(filters, cursor)
  }

  /**
   * The vocabulary the filter dropdowns are built from.
   *
   * @returns the actions, target types, actor types and a capped list of actors
   */
  async getMeta(): Promise<AuditMeta> {
    return this.metadata.getMeta()
  }
}

/** The panel's activity-log service, bound to the shared client. */
export const activityLogsService = new ActivityLogsService(apiClient)
