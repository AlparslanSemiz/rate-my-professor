import {
  auditLogsService,
  type AuditLog,
  type AuditLogFilters,
} from '../../../api/AuditLogsService'
import { useCursorLogPage, type CursorLogPage } from '../../../hooks/useCursorLogPage'
import {
  EMPTY_AUDIT_META,
  EMPTY_FILTERS,
  getAuditErrorMessage,
  toAuditFilters,
  validateAuditDraft,
} from '../auditLogModel'

const fetchMeta = () => auditLogsService.getMeta()

const NO_FILTERS: AuditLogFilters = {}

async function fetchPage(
  filters: AuditLogFilters,
  cursor?: string | null,
): Promise<CursorLogPage<AuditLog>> {
  const page = cursor
    ? await auditLogsService.getLogs(filters, cursor)
    : await auditLogsService.getLogs(filters)
  return { items: page.auditLogs, nextCursor: page.nextCursor }
}

export function useAuditLogs() {
  return useCursorLogPage({
    fetchMeta,
    fetchPage,
    toFilters: toAuditFilters,
    validateDraft: validateAuditDraft,
    getErrorMessage: getAuditErrorMessage,
    emptyMeta: EMPTY_AUDIT_META,
    emptyDraft: EMPTY_FILTERS,
    emptyFilters: NO_FILTERS,
    initialErrorFallback: 'Failed to load audit logs',
    filterErrorFallback: 'Failed to apply audit log filters',
    loadMoreErrorFallback: 'Failed to load more audit logs',
  })
}
