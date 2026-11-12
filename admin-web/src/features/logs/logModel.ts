import { NotFoundError } from '@/api/client'
import type {
  AuditAction,
  AuditActorType,
  AuditLogFilters,
  AuditMeta,
  AuditTargetType,
  AuditValue,
} from '@/api/logs'
import { isAuditActorType } from '@/domain/auditLog'
import { validateDateRange } from '@/utils/dateRange'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { EMPTY_VALUE } from '@/utils/emptyValue'
import { enumLabel } from '@/utils/enumLabel'

/**
 * The filter form's working copy, shared by both log screens.
 *
 * `from` and `to` are `yyyy-mm-dd` as a date input supplies them; they become inclusive
 * instants only when the filters are applied. `actorType` is offered by the activity screen
 * and not by the audit one — the draft carries the field either way, because a draft that
 * changed shape per screen would make the shared filter bar generic over its own state.
 */
export interface FilterDraft {
  q: string
  actorId: string | null
  actorType: AuditActorType | null
  action: AuditAction | null
  targetType: AuditTargetType | null
  from: string
  to: string
}

/** The filter form before anything is typed into it. Shared by every caller, so frozen. */
export const EMPTY_FILTERS: FilterDraft = Object.freeze({
  q: '',
  actorId: null,
  actorType: null,
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
export function isMetaAction(value: string | null, meta: AuditMeta): value is AuditAction {
  return value !== null && meta.actions.some((action) => action === value)
}

/**
 * @param value whatever the dropdown reported
 * @param meta the vocabulary the backend reported
 * @returns whether it is a target type this backend serves
 */
export function isMetaTargetType(
  value: string | null,
  meta: AuditMeta,
): value is AuditTargetType {
  return value !== null && meta.targetTypes.some((targetType) => targetType === value)
}

/** The two actor types, for a backend whose meta reports none. */
const BOTH_ACTOR_TYPES: readonly AuditActorType[] = Object.freeze(['ADMIN', 'USER'] as const)

/**
 * The actor types the "Who" dropdown offers.
 *
 * Defaulted rather than left empty, because `actorTypes` is the one meta list the service
 * fills in itself when a backend predates the field — and a filter with no options reads as
 * "this backend has no actors" rather than as "this backend did not say".
 *
 * @param meta the vocabulary the backend reported
 * @returns what it reported, or both types when it reported none
 */
export function actorTypeOptions(meta: AuditMeta): readonly AuditActorType[] {
  return meta.actorTypes.length > 0 ? meta.actorTypes : BOTH_ACTOR_TYPES
}

/**
 * @param value whatever the dropdown reported
 * @returns whether it is an actor type this panel knows
 */
export function isActorType(value: string | null): value is AuditActorType {
  return isAuditActorType(value)
}

/**
 * @param draft the filter form's working copy
 * @returns the filters as a request; blanks become `undefined` so they are not sent
 */
export function toLogFilters(draft: FilterDraft): AuditLogFilters {
  return {
    q: draft.q,
    actorId: draft.actorId ?? undefined,
    actorType: draft.actorType ?? undefined,
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
export function validateLogDraft(draft: FilterDraft) {
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
export function formatLogValue(value: AuditValue): string {
  if (value === null) return EMPTY_VALUE
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

/**
 * A backend enum as a label, for a value that came off the wire and was never validated.
 *
 * `enumLabel` calls `String.prototype.split`, so it throws on anything that is not a string —
 * and an entry whose `action` is absent or numeric took the whole screen down through the
 * `ErrorBoundary` (`F-028`, mechanism 2). The vocabulary itself is not the panel's to police:
 * the dropdowns are built from `/…/meta` and the table renders whatever it is given, so an
 * action this panel has never heard of must read as *that action*, not as an error.
 *
 * Deliberately scoped to the two log screens. `enumLabel` is left unguarded because ten of
 * `F-028`'s remaining cases are on four other screens where "what should an unknown enum read
 * as" is a wording decision this change does not make.
 *
 * @param value whatever arrived in a field the panel expected an enum in
 * @returns the readable label, or the shared empty marker when there is no string to label
 */
export function logEnumLabel(value: unknown): string {
  return typeof value === 'string' && value !== '' ? enumLabel(value) : EMPTY_VALUE
}

/** The two messages a log screen needs when a read fails. */
export interface LogErrorWording {
  /** Shown when the deployment has no such endpoints at all. */
  readonly unavailable: string
  /** Shown when the failure explains nothing itself. */
  readonly fallback: string
}

/**
 * A `NotFoundError` from a log read means the deployment has no such endpoints, not that a
 * particular entry is missing — so it is worth saying so rather than reporting "not found".
 *
 * @param error whatever the read rejected with
 * @param wording this screen's two messages
 * @returns the message to show the operator
 */
export function getLogErrorMessage(error: unknown, wording: LogErrorWording) {
  if (error instanceof NotFoundError) return wording.unavailable
  return getErrorMessage(error, wording.fallback)
}
