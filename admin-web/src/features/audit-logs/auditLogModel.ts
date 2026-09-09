import { ConflictError, NotFoundError } from '@/api/client'
import type {
  AuditAction,
  AuditLogFilters,
  AuditMeta,
  AuditTargetType,
  AuditValue,
} from '@/api/logs'
import type { RevertBlockedReason } from '@/domain/auditLog'
import { validateDateRange } from '@/utils/dateRange'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { EMPTY_VALUE } from '@/utils/emptyValue'

const AUDIT_API_UNAVAILABLE_MESSAGE =
  'The configured backend does not support audit logs yet. Deploy the audit API endpoints, then try again.'

/**
 * The filter form's working copy. `from` and `to` are `yyyy-mm-dd` as a date input supplies
 * them; they become inclusive instants only when the filters are applied.
 */
export interface FilterDraft {
  q: string
  actorId: string | null
  action: AuditAction | null
  targetType: AuditTargetType | null
  from: string
  to: string
}

/** The filter form before anything is typed into it. Shared by every caller, so frozen. */
export const EMPTY_FILTERS: FilterDraft = Object.freeze({
  q: '',
  actorId: null,
  action: null,
  targetType: null,
  from: '',
  to: '',
})

/**
 * Whether the value is an action **this backend serves**, rather than one this panel knows.
 *
 * Checked against the meta the backend reported, not against the compiled-in list: a
 * deployment may log actions a newer panel knows nothing about, and may not log ones it does.
 *
 * @param value whatever the dropdown reported
 * @param meta the vocabulary the backend reported
 */
export function isAuditAction(value: string | null, meta: AuditMeta): value is AuditAction {
  return value !== null && meta.actions.some((action) => action === value)
}

/**
 * @param value whatever the dropdown reported
 * @param meta the vocabulary the backend reported
 * @returns whether it is a target type this backend serves
 */
export function isAuditTargetType(
  value: string | null,
  meta: AuditMeta,
): value is AuditTargetType {
  return value !== null && meta.targetTypes.some((targetType) => targetType === value)
}

/**
 * @param draft the filter form's working copy
 * @returns the filters as a request; blanks become `undefined` so they are not sent
 */
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

/**
 * @param draft the filter form's working copy
 * @returns the message to show under the form, or an empty string when the range is usable
 */
export function validateAuditDraft(draft: FilterDraft) {
  return validateDateRange(draft)
}

/**
 * One before/after value, as the details view shows it.
 *
 * `null` becomes the shared empty marker rather than the word "null", and a boolean becomes
 * Yes/No — an operator reading what changed should not be reading JSON.
 *
 * @param value the recorded value
 * @returns it rendered for a person
 */
export function formatAuditValue(value: AuditValue): string {
  if (value === null) return EMPTY_VALUE
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

/**
 * @param reason the backend's machine-readable code, or null when it named none
 * @returns why the change cannot be undone, in the operator's words; a general message for a
 *          code this panel has not been taught
 */
export function revertRefusalMessage(reason: string | null): string {
  if (reason && reason in REVERT_REFUSALS) {
    return REVERT_REFUSALS[reason as RevertBlockedReason]
  }
  return UNKNOWN_REVERT_REFUSAL
}

/**
 * A refused revert carries one of those reasons; anything else keeps its own message. The
 * fallback is deliberately not "the change may or may not have been undone" — a refusal is a
 * refusal, and the list is re-read either way.
 *
 * @param error whatever the revert mutation rejected with
 * @returns the message to show the operator
 */
export function getRevertErrorMessage(error: unknown) {
  if (error instanceof ConflictError) return revertRefusalMessage(error.reason)
  return getErrorMessage(error, 'The change could not be undone.')
}

/**
 * A `NotFoundError` here means the deployment has no audit endpoints at all, not that a
 * particular entry is missing — so it is worth saying so rather than reporting "not found".
 *
 * @param error whatever the read rejected with
 * @param fallback the message to use when the error explains nothing itself
 * @returns the message to show the operator
 */
export function getAuditErrorMessage(error: unknown, fallback: string) {
  if (error instanceof NotFoundError) return AUDIT_API_UNAVAILABLE_MESSAGE
  return getErrorMessage(error, fallback)
}
