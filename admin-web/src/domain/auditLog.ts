import { enumGuard } from './enumGuard'

/**
 * Vocabulary for the two logs the panel reads.
 *
 * `/audit-logs` and `/activity-logs` share one table and one entry shape on the backend,
 * separated by `actor.type`; they differ only in which actions they serve. Both halves are
 * modelled here, and were until the activity screen was deleted on 2026-09-09 — the action
 * set was narrowed to the administrative half then and is whole again now (ADR 0016).
 *
 * None of these lists is a filter. The dropdowns are built from `/…/meta` and the tables
 * render whatever they are given; the lists exist to give the panel's own code a type to
 * speak in, which is why a value the backend adds is a stale list here rather than a broken
 * screen.
 */

/** What admins did through the panel — served by `/audit-logs`. */
export const AUDIT_ACTIONS = [
  'ADMIN_LOGIN',
  'ADMIN_LOGOUT',
  'USER_UPDATED',
  'USER_WARNING_CREATED',
  'USER_WARNING_UPDATED',
  'USER_WARNING_DELETED',
  'USER_BLOCKED',
  'USER_UNBLOCKED',
  'USER_DELETED',
  'COMMENT_UPDATED',
  'COMMENT_DELETED',
  'ANSWER_UPDATED',
  'ANSWER_DELETED',
  'RATING_DELETED',
  'COMMENT_REPORT_STATUS_CHANGED',
  'COMMENT_REPORT_DELETED',
  'ANSWER_REPORT_STATUS_CHANGED',
  'ANSWER_REPORT_DELETED',
  'BUG_REPORT_UPDATED',
  'BUG_REPORT_ISSUE_CREATED',
  'BUG_REPORT_DELETED',
  'LECTURE_CREATED',
  'LECTURE_UPDATED',
  'LECTURE_DELETED',
  'PROFESSOR_CREATED',
  'PROFESSOR_UPDATED',
  'PROFESSOR_DELETED',
] as const

/**
 * What students did in the app, plus every refused request — served by `/activity-logs`.
 *
 * `changes` is always empty for these: nothing existing is modified, so the detail is in
 * `metadata` instead. The two refusals are the reason this screen is not only a curiosity —
 * `LOGIN_REFUSED` carries why a sign-in was turned down and `ACCESS_REFUSED` carries the path
 * an authenticated caller was answered `403` on.
 */
export const ACTIVITY_ACTIONS = [
  'USER_LOGIN',
  'USER_LOGOUT',
  'COMMENT_CREATED',
  'ANSWER_CREATED',
  'RATING_SUBMITTED',
  'COMMENT_REPORT_CREATED',
  'ANSWER_REPORT_CREATED',
  'BUG_REPORT_CREATED',
  'LOGIN_REFUSED',
  'ACCESS_REFUSED',
] as const

/**
 * The two actions that are not something someone successfully did.
 *
 * Their own list rather than a suffix rule: `_REFUSED` happens to fit both today, and a rule
 * would quietly claim every future action ending that way is a refusal the panel understands.
 */
export const REFUSAL_ACTIONS = ['LOGIN_REFUSED', 'ACCESS_REFUSED'] as const

/**
 * Every target an entry can name. Shared by both logs, and wider than either action list on
 * purpose: it mirrors what `/…/meta` may return, and the panel renders whatever it is given
 * rather than filtering the backend's vocabulary down to its own.
 */
export const AUDIT_TARGET_TYPES = [
  'ADMIN_SESSION',
  'USER_SESSION',
  'USER',
  'WARNING',
  'COMMENT',
  'ANSWER',
  'RATING',
  'LECTURE',
  'PROFESSOR',
  'COMMENT_REPORT',
  'ANSWER_REPORT',
  'BUG_REPORT',
  'ENDPOINT',
] as const

/**
 * `USER` is not only the activity log's: the audit log is backed by the same table and its
 * meta reports both, so both filters accept both.
 */
export const AUDIT_ACTOR_TYPES = ['ADMIN', 'USER'] as const

/** One of {@link AUDIT_ACTIONS} — what an admin did. */
export type AuditAction = (typeof AUDIT_ACTIONS)[number]
/** One of {@link ACTIVITY_ACTIONS} — what a student did, or what was refused. */
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number]
/** Either half. What the shared table is keyed on when it does not care which log it is. */
export type LogAction = AuditAction | ActivityAction
/** One of {@link AUDIT_TARGET_TYPES} — what kind of record an entry names. */
export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number]
/** One of {@link AUDIT_ACTOR_TYPES} — who acted. */
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number]
/** A field value as the log records it: whatever JSON could hold, flattened to a scalar. */
export type AuditValue = string | number | boolean | null

/** Who performed the action, denormalised into the entry so reading the log needs no joins. */
export interface AuditActor {
  type: AuditActorType
  id: string
  name: string
  email: string
  role: string
}

/** What the action was performed on. `label` is how it read at the time, not how it reads now. */
export interface AuditTarget {
  type: AuditTargetType
  id: string
  label: string
}

/** One field's value either side of an edit. Both sides are recorded, so a revert has a value to put back. */
export interface AuditChange {
  before: AuditValue
  after: AuditValue
}

/**
 * One thing that happened, as the log records it.
 *
 * `target` is null for entries that name no record — a sign-in is about the session, not
 * about a row. `changes` is empty for everything that is not a field edit, which is why the
 * details view shows a heading with nothing under it for a deletion.
 */
export interface AuditEntry {
  id: string
  action: LogAction
  createdAt: string
  actor: AuditActor
  target: AuditTarget | null
  changes: Record<string, AuditChange>
  metadata: Record<string, AuditValue>
}

/**
 * An administrative entry, which the backend also says something about undoing. Only the
 * audit log carries these: what a student did in the app is not the panel's to reverse.
 */
export interface AuditLog extends AuditEntry {
  /** Whether this entry can be undone right now. Only field edits ever can. */
  revertible: boolean
  /**
   * Why it cannot, in the same vocabulary a refused revert answers with, so the hidden button
   * and the button pressed a minute too late explain themselves the same way.
   */
  revertBlockedReason: string | null
  /** The entry recording the reversal, once this one has been undone. */
  revertedByAuditId: string | null
}

/** Why an entry cannot be reverted. The backend's vocabulary, used on reads and on refusals. */
export const REVERT_BLOCKED_REASONS = [
  'ACTION_NOT_REVERTIBLE',
  'WINDOW_EXPIRED',
  'VALUE_CHANGED',
  'ALREADY_REVERTED',
  'TARGET_MISSING',
] as const

/** One of {@link REVERT_BLOCKED_REASONS}. */
export type RevertBlockedReason = (typeof REVERT_BLOCKED_REASONS)[number]

/**
 * What `GET /audit-logs` and `GET /activity-logs` narrow on — the same parameters, which is
 * why one query builder serves both. Every field is optional and an omitted one is not sent;
 * `from` and `to` are inclusive ISO instants, built by {@link startOfDay} and {@link endOfDay}.
 */
export interface AuditLogFilters {
  q?: string
  actorId?: string
  actorType?: AuditActorType
  action?: LogAction
  targetType?: AuditTargetType
  from?: string
  to?: string
}


/**
 * Filter vocabulary a log screen's dropdowns are built from. `actors` is capped rather than
 * exhaustive: both endpoints are backed by one log table, so every account that ever signed
 * in is an actor in it — `q` is what finds someone beyond the cap.
 */
export interface AuditMeta {
  readonly actors: readonly Pick<AuditActor, 'id' | 'name' | 'email' | 'role'>[]
  readonly actions: readonly LogAction[]
  readonly targetTypes: readonly AuditTargetType[]
  readonly actorTypes: readonly AuditActorType[]
}

/**
 * The filter vocabulary before anything has been read, and while a read is failing.
 *
 * Frozen because it is a *shared* default: one object is handed to every caller that asks,
 * and with two log screens both of them ask. A `const` binding stops the name being
 * reassigned and does nothing about the four arrays inside it, so a single `push` anywhere
 * would have added an entry to the empty meta for the rest of the session, on both screens.
 */
export const EMPTY_AUDIT_META: AuditMeta = Object.freeze({
  actors: Object.freeze([]),
  actions: Object.freeze([]),
  targetTypes: Object.freeze([]),
  actorTypes: Object.freeze([]),
})

/** @returns whether the value is an actor type this panel knows. */
export const isAuditActorType = enumGuard(AUDIT_ACTOR_TYPES)

/** @returns whether the action is one of the two refusals, which read differently everywhere. */
export const isRefusal = enumGuard(REFUSAL_ACTIONS)

/**
 * The backend takes inclusive ISO date-times; the filter form supplies `yyyy-mm-dd`, picked
 * on the operator's own calendar. Reading that as a UTC day shifts the window by the local
 * offset — in CEST, choosing "20 Aug" dropped everything logged in the first two hours of
 * the 20th and pulled in the first two hours of the 21st. The bounds are built from the
 * local day instead, so the range covers exactly the day that was chosen.
 */
const FIRST_MOMENT_OF_DAY = [0, 0, 0, 0] as const
/** 23:59:59.999 — the last millisecond the backend's inclusive upper bound will match. */
const LAST_MOMENT_OF_DAY = [23, 59, 59, 999] as const

function dayBoundary(value: string | undefined, endOfDay: boolean): string | undefined {
  if (!value) return undefined

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined

  const date = endOfDay
    ? new Date(year, month - 1, day, ...LAST_MOMENT_OF_DAY)
    : new Date(year, month - 1, day, ...FIRST_MOMENT_OF_DAY)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

/**
 * @param value a `yyyy-mm-dd` date as the filter form supplies it
 * @returns the first instant of that day in the operator's own timezone, as ISO, or
 *          `undefined` when there is no date to bound
 */
export function startOfDay(value?: string) {
  return dayBoundary(value, false)
}

/**
 * @param value a `yyyy-mm-dd` date as the filter form supplies it
 * @returns the last instant of that day in the operator's own timezone, as ISO, or
 *          `undefined` when there is no date to bound
 */
export function endOfDay(value?: string) {
  return dayBoundary(value, true)
}
