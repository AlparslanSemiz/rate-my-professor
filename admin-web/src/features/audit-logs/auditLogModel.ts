import { ApiError } from '@/api/client'
import type {
  AuditAction,
  AuditLogFilters,
  AuditMeta,
  AuditTargetType,
  AuditValue,
} from '@/api/logs'
import { EMPTY_LOG_META, type RevertBlockedReason } from '@/domain/auditLog'
import { validateDateRange } from '@/utils/dateRange'
import { getErrorMessage } from '@/utils/getErrorMessage'

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

/**
 * The five reasons a change cannot be undone, in the operator's words. The backend uses the
 * same vocabulary for a button it says to hide and for a revert it refuses, so both are
 * explained from here rather than from two lists that drift.
 */
const REVERT_REFUSALS: Record<RevertBlockedReason, string> = {
  ACTION_NOT_REVERTIBLE:
    'This entry is not a field edit, so there is nothing to put back. Creations, deletions and sign-ins cannot be undone.',
  WINDOW_EXPIRED: 'This change is too old to undo.',
  VALUE_CHANGED:
    'The value changed again after this entry, so undoing it would discard that later change.',
  ALREADY_REVERTED: 'This change has already been undone.',
  TARGET_MISSING: 'The record this entry is about no longer exists.',
}

const UNKNOWN_REVERT_REFUSAL = 'This change cannot be undone.'

export function revertRefusalMessage(reason: string | null): string {
  if (reason && reason in REVERT_REFUSALS) {
    return REVERT_REFUSALS[reason as RevertBlockedReason]
  }
  return UNKNOWN_REVERT_REFUSAL
}

/**
 * A refused revert is a `409` carrying one of those reasons; anything else keeps its own
 * message. The fallback is deliberately not "the change may or may not have been undone" —
 * a refusal is a refusal, and the list is re-read either way.
 */
export function getRevertErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 409) return revertRefusalMessage(error.reason)
  return getErrorMessage(error, 'The change could not be undone.')
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
