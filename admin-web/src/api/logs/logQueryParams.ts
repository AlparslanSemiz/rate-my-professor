import { endOfDay, startOfDay, type AuditLogFilters } from '@/domain/auditLog'
import { DEFAULT_PAGE_SIZE } from '@/api/client/paging'


/**
 * Turns the filter draft into the query string `/audit-logs` expects.
 *
 * The date bounds are the part worth knowing: `from` and `to` arrive as `yyyy-mm-dd` picked
 * on the operator's own calendar and go out as inclusive instants in their timezone, not UTC.
 *
 * @param filters what to narrow on; absent and blank fields are dropped by the client
 * @param cursor the cursor from the previous page
 * @param limit how many entries to ask for
 * @returns the parameters, with absent ones left for the client to omit
 */
export function toLogQueryParams(
  filters: AuditLogFilters = {},
  cursor?: string | null,
  limit = DEFAULT_PAGE_SIZE,
): Record<string, string | number | boolean | null | undefined> {
  return {
    limit,
    cursor,
    q: filters.q?.trim(),
    actorId: filters.actorId,
    actorType: filters.actorType,
    action: filters.action,
    targetType: filters.targetType,
    from: startOfDay(filters.from),
    to: endOfDay(filters.to),
  }
}
