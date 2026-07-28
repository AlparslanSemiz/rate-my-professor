import { ApiError } from '../../api/ApiClient'
import {
  ACTIVITY_OUTCOMES,
  type ActivityActor,
  type ActivityContext,
  type ActivityLogFilters,
  type ActivityMeta,
  type ActivityOutcome,
  type ActivityTargetType,
  type ActivityType,
  type ActivityValue,
} from '../../api/ActivityLogsService'
import { validateDateRange } from '../../utils/dateRange'
import { getErrorMessage } from '../../utils/getErrorMessage'

const ACTIVITY_API_UNAVAILABLE_MESSAGE =
  'The configured backend does not track application activity yet. Deploy the activity log API endpoints, then try again.'

export const ANONYMOUS_ACTOR_NAME = 'Anonymous'

export interface ActivityFilterDraft {
  q: string
  actorId: string | null
  type: ActivityType | null
  targetType: ActivityTargetType | null
  outcome: ActivityOutcome | null
  from: string
  to: string
}

export const EMPTY_ACTIVITY_META: ActivityMeta = {
  actors: [],
  types: [],
  targetTypes: [],
  outcomes: [],
}

export const EMPTY_ACTIVITY_FILTERS: ActivityFilterDraft = {
  q: '',
  actorId: null,
  type: null,
  targetType: null,
  outcome: null,
  from: '',
  to: '',
}

export const NO_ACTIVITY_FILTERS: ActivityLogFilters = {}

export function toActivityFilters(draft: ActivityFilterDraft): ActivityLogFilters {
  return {
    q: draft.q,
    actorId: draft.actorId ?? undefined,
    type: draft.type ?? undefined,
    targetType: draft.targetType ?? undefined,
    outcome: draft.outcome ?? undefined,
    from: draft.from || undefined,
    to: draft.to || undefined,
  }
}

export function validateActivityDraft(draft: ActivityFilterDraft) {
  return validateDateRange(draft)
}

export function getActivityErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 404) return ACTIVITY_API_UNAVAILABLE_MESSAGE
  return getErrorMessage(error, fallback)
}

/** The outcome filter falls back to the known values when the backend reports none. */
export function outcomeOptions(meta: ActivityMeta): readonly ActivityOutcome[] {
  return meta.outcomes.length > 0 ? meta.outcomes : ACTIVITY_OUTCOMES
}

export function isActivityOutcome(value: string | null): value is ActivityOutcome {
  return value !== null && ACTIVITY_OUTCOMES.some((outcome) => outcome === value)
}

export function outcomeColor(outcome: ActivityOutcome) {
  if (outcome === 'FAILURE') return 'red'
  if (outcome === 'DENIED') return 'orange'
  return 'green'
}

/**
 * Activity types are an open set, so the badge colour is derived from the verb at the end of
 * the type rather than from a fixed lookup table.
 */
export function activityTypeColor(type: ActivityType) {
  if (type.endsWith('_DELETED')) return 'red'
  if (type.endsWith('_FAILED')) return 'orange'
  if (type.endsWith('_REPORTED') || type.endsWith('_SUBMITTED')) return 'yellow'
  if (type.endsWith('_CREATED') || type.endsWith('_REGISTERED')) return 'teal'
  if (type.startsWith('USER_LOGIN') || type.startsWith('USER_LOGOUT')) return 'violet'
  return 'blue'
}

export function formatActivityValue(value: ActivityValue): string {
  if (value === null) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

export function actorName(actor: ActivityActor | null) {
  return actor?.name ?? ANONYMOUS_ACTOR_NAME
}

export function actorEmail(actor: ActivityActor | null) {
  return actor?.email ?? 'Not signed in'
}

const CONTEXT_LABELS: ReadonlyArray<[keyof ActivityContext, string]> = [
  ['route', 'Route'],
  ['method', 'Method'],
  ['ip', 'IP address'],
  ['userAgent', 'User agent'],
]

/** Flattens the optional context object into label/value pairs, skipping absent fields. */
export function contextEntries(context: ActivityContext | null): Array<[string, string]> {
  if (!context) return []
  const entries: Array<[string, string]> = []
  for (const [key, label] of CONTEXT_LABELS) {
    const value = context[key]
    if (value) entries.push([label, value])
  }
  return entries
}

export function contextSummary(context: ActivityContext | null) {
  return context?.route ?? '—'
}
