import { apiClient, type HttpTransport, type BasicResponse } from '@/api/client/ApiClient'
import { AuditLogRevertService } from './AuditLogRevertService'
import { LogMetaService } from './LogMetaService'
import { LogReaderService } from './LogReaderService'
import { toAuditLog } from './logMapper'
import { AUDIT_LOG_RESOURCE } from './logResource'
import type { AuditLog, AuditLogFilters, AuditMeta } from '@/domain/auditLog'
import type { LogPage } from './logTypes'

/**
 * The audit log: reading it, undoing an entry, and the vocabulary its filters offer.
 *
 * Three services underneath because the three have nothing in common but the path — reading
 * pages, reverting a single edit, and fetching the filter vocabulary are separate concerns
 * with separate failure modes, and the reverts in particular carry their own refusal codes.
 * Two of the three are shared with `ActivityLogsService`, pointed at the other resource; the
 * reverter is not, and that asymmetry is the difference between the two screens.
 */
export class AuditLogsService {
  private readonly reader: LogReaderService<AuditLog>
  private readonly metadata: LogMetaService
  private readonly reverter: AuditLogRevertService

  constructor(client: HttpTransport) {
    this.reader = new LogReaderService(client, AUDIT_LOG_RESOURCE, toAuditLog)
    this.metadata = new LogMetaService(client, AUDIT_LOG_RESOURCE)
    this.reverter = new AuditLogRevertService(client)
  }

  /**
   * One page of the log, newest first.
   *
   * @param filters what to narrow on; an omitted field is not sent
   * @param cursor the cursor from the previous page, or absent for the first
   * @returns the page and the cursor for the next one, `null` on the last
   * @throws {NotFoundError} when the backend has no audit endpoints deployed at all — the
   *         panel says so rather than reporting "no entries"
   * @throws {ContractError} when the response holds no `auditLogs` list
   */
  async getLogs(filters: AuditLogFilters = {}, cursor?: string | null): Promise<LogPage<AuditLog>> {
    return this.reader.getLogs(filters, cursor)
  }

  /**
   * Puts back the value a field edit changed.
   *
   * Only field edits are revertible, and only inside the backend's window. The caller must
   * re-read the log afterwards: undoing writes an entry of its own.
   *
   * @param id the entry to undo
   * @returns the envelope
   * @throws {ConflictError} carrying one of the five `reason` codes in
   *         {@link REVERT_BLOCKED_REASONS} — the value changed again, the window expired, it
   *         was already undone, the record is gone, or it was never revertible
   */
  revert(id: string): Promise<BasicResponse> {
    return this.reverter.revert(id)
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

/** The panel's audit-log service, bound to the shared client. */
export const auditLogsService = new AuditLogsService(apiClient)
