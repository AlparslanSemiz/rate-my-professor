import { ApiError } from '../../api/ApiClient'
import type {
  AuditAction,
  AuditLogFilters,
  AuditMeta,
  AuditTargetType,
  AuditValue,
} from '../../api/AuditLogsService'
import { EMPTY_LOG_META } from '../../domain/auditLog'
import { validateDateRange } from '../../utils/dateRange'
import { getErrorMessage } from '../../utils/getErrorMessage'

const AUDIT_API_UNAVAILABLE_MESSAGE =
  'The configured backend does not support audit logs yet. Deploy the audit API endpoints, then try again.'

export interface FilterDraft {
  q: string
  actorId: string | null
  action: AuditAction | null
  targetType: AuditTargetType | null
  from: string
  to: string
}

export const EMPTY_AUDIT_META: AuditMeta = EMPTY_LOG_META

export const EMPTY_FILTERS: FilterDraft = {
  q: '',
  actorId: null,
  action: null,
  targetType: null,
  from: '',
  to: '',
}

export function isAuditAction(value: string | null, meta: AuditMeta): value is AuditAction {
  return value !== null && meta.actions.some((action) => action === value)
}

export function isAuditTargetType(
  value: string | null,
  meta: AuditMeta,
): value is AuditTargetType {
  return value !== null && meta.targetTypes.some((targetType) => targetType === value)
}

export function toAuditFilters(draft: FilterDraft): AuditLogFilters {
  return {
    q: draft.q,
    actorId: draft.actorId ?? undefined,
    action: draft.action ?? undefined,
    targetType: draft.targetType ?? undefined,
    from: draft.from || undefined,
    to: draft.to || undefined,
  }
}

export function validateAuditDraft(draft: FilterDraft) {
  return validateDateRange(draft)
}

export function formatAuditValue(value: AuditValue): string {
  if (value === null) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

export function getAuditErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 404) return AUDIT_API_UNAVAILABLE_MESSAGE
  return getErrorMessage(error, fallback)
}

/**
 * Derived from the verb rather than a fixed table: the administrative action set grows with
 * every new thing an admin can do, and a deletion has to read as a deletion whatever it removed.
 */
export function auditActionColor(action: string) {
  if (action === 'ADMIN_LOGIN') return 'green'
  if (action === 'ADMIN_LOGOUT') return 'gray'
  if (action.endsWith('_DELETED')) return 'red'
  if (action === 'USER_BLOCKED' || action === 'USER_WARNING_CREATED') return 'orange'
  return 'blue'
}
