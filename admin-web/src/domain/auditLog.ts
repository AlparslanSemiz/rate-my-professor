import { enumGuard } from './enumGuard'

/**
 * Vocabulary for the log the panel reads. This file once described two endpoints —
 * `/audit-logs` and `/activity-logs` share a table and an entry shape on the backend — but
 * the panel no longer has an activity screen, so only the administrative half is modelled
 * here. The backend still serves `/activity-logs`; nothing in this repository calls it.
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

/**
 * Every target an entry can name. Wider than the actions above on purpose: the list mirrors
 * what `/audit-logs/meta` may return, and the panel renders whatever it is given rather than
 * filtering the backend's vocabulary down to its own.
 */
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

/** `USER` stays: the backend reports it on `/audit-logs/meta`, so the filter must accept it. */
export const LOG_ACTOR_TYPES = ['ADMIN', 'USER'] as const

export type LogAction = (typeof ADMINISTRATIVE_ACTIONS)[number]
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
 * Filter vocabulary the audit log's dropdowns are built from. `actors` is capped rather
 * than exhaustive: /audit-logs is backed by a log table shared with the student-side
 * record, so every account that ever signed in is an actor in it — `q` is what finds
 * someone beyond the cap.
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

export const isLogActorType = enumGuard(LOG_ACTOR_TYPES)

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
