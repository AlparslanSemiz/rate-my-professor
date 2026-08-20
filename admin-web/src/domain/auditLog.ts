/**
 * Vocabulary shared by the two log endpoints. `/audit-logs` and `/activity-logs` read the
 * same table and return the same entry shape; they differ only in which actions they serve,
 * so the entry types live here and each service names its own slice of the action set.
 */

/** What admins did through the panel — served by `/audit-logs`. */
export const ADMINISTRATIVE_ACTIONS = [
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
  'BUG_REPORT_DELETED',
  'LECTURE_UPDATED',
  'LECTURE_DELETED',
  'PROFESSOR_UPDATED',
  'PROFESSOR_DELETED',
] as const

/** What users did in the student app, plus every refused request — served by `/activity-logs`. */
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

export const LOG_TARGET_TYPES = [
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

export const LOG_ACTOR_TYPES = ['ADMIN', 'USER'] as const

export type AdministrativeAction = (typeof ADMINISTRATIVE_ACTIONS)[number]
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number]
export type LogAction = AdministrativeAction | ActivityAction
export type LogTargetType = (typeof LOG_TARGET_TYPES)[number]
export type LogActorType = (typeof LOG_ACTOR_TYPES)[number]
export type LogValue = string | number | boolean | null

export interface LogActor {
  type: LogActorType
  id: string
  name: string
  email: string
  role: string
}

export interface LogTarget {
  type: LogTargetType
  id: string
  label: string
}

export interface LogChange {
  before: LogValue
  after: LogValue
}

export interface LogEntry {
  id: string
  action: LogAction
  createdAt: string
  actor: LogActor
  target: LogTarget | null
  changes: Record<string, LogChange>
  metadata: Record<string, LogValue>
}

/**
 * An administrative entry, which the backend also says something about undoing. Only the
 * audit log carries these: what a student did in the app is not the panel's to reverse.
 */
export interface RevertableLogEntry extends LogEntry {
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

export type RevertBlockedReason = (typeof REVERT_BLOCKED_REASONS)[number]

export interface LogFilters {
  q?: string
  actorId?: string
  actorType?: LogActorType
  action?: LogAction
  targetType?: LogTargetType
  from?: string
  to?: string
}

export interface LogPage {
  entries: LogEntry[]
  nextCursor: string | null
}

/**
 * Filter vocabulary of one log. `actors` is capped rather than exhaustive — every account
 * that ever signed in is an actor in the activity log — so `q` is what finds the rest.
 */
export interface LogMeta {
  actors: Array<Pick<LogActor, 'id' | 'name' | 'email' | 'role'>>
  actions: LogAction[]
  targetTypes: LogTargetType[]
  actorTypes: LogActorType[]
}

export const EMPTY_LOG_META: LogMeta = {
  actors: [],
  actions: [],
  targetTypes: [],
  actorTypes: [],
}

export function isLogActorType(value: string | null): value is LogActorType {
  return value === 'ADMIN' || value === 'USER'
}

/**
 * The backend takes inclusive ISO date-times; the filter form supplies `yyyy-mm-dd`, picked
 * on the operator's own calendar. Reading that as a UTC day shifts the window by the local
 * offset — in CEST, choosing "20 Aug" dropped everything logged in the first two hours of
 * the 20th and pulled in the first two hours of the 21st. The bounds are built from the
 * local day instead, so the range covers exactly the day that was chosen.
 */
function dayBoundary(value: string | undefined, endOfDay: boolean): string | undefined {
  if (!value) return undefined

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined

  const date = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function startOfDay(value?: string) {
  return dayBoundary(value, false)
}

export function endOfDay(value?: string) {
  return dayBoundary(value, true)
}
