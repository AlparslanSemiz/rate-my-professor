import { endOfDay, startOfDay, type LogFilters } from '../domain/auditLog'

const DEFAULT_LOG_PAGE_SIZE = 50

export function toLogQueryParams(
  filters: LogFilters = {},
  cursor?: string | null,
  limit = DEFAULT_LOG_PAGE_SIZE,
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
