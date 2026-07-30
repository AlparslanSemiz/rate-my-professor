import { ApiError } from '../../api/ApiClient'
import type {
  ActivityAction,
  ActivityLogFilters,
  ActivityMeta,
  ActivityTargetType,
  ActivityValue,
} from '../../api/ActivityLogsService'
import { EMPTY_LOG_META, isLogActorType, type LogActorType } from '../../domain/auditLog'
import { validateDateRange } from '../../utils/dateRange'
import { getErrorMessage } from '../../utils/getErrorMessage'

const ACTIVITY_API_UNAVAILABLE_MESSAGE =
  'The configured backend does not track application activity yet. Deploy the activity log API endpoints, then try again.'

export interface ActivityFilterDraft {
  q: string
  actorId: string | null
  actorType: LogActorType | null
  action: ActivityAction | null
  targetType: ActivityTargetType | null
  from: string
  to: string
}

export const EMPTY_ACTIVITY_META: ActivityMeta = EMPTY_LOG_META

export const EMPTY_ACTIVITY_FILTERS: ActivityFilterDraft = {
  q: '',
  actorId: null,
  actorType: null,
  action: null,
  targetType: null,
  from: '',
  to: '',
}

export const NO_ACTIVITY_FILTERS: ActivityLogFilters = {}

export function toActivityFilters(draft: ActivityFilterDraft): ActivityLogFilters {
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

export function validateActivityDraft(draft: ActivityFilterDraft) {
  return validateDateRange(draft)
}

export function getActivityErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 404) return ACTIVITY_API_UNAVAILABLE_MESSAGE
  return getErrorMessage(error, fallback)
}

export function isActivityAction(
  value: string | null,
  meta: ActivityMeta,
): value is ActivityAction {
  return value !== null && meta.actions.some((action) => action === value)
}

export function isActivityTargetType(
  value: string | null,
  meta: ActivityMeta,
): value is ActivityTargetType {
  return value !== null && meta.targetTypes.some((targetType) => targetType === value)
}

export function isActivityActorType(value: string | null): value is LogActorType {
  return isLogActorType(value)
}

const BOTH_ACTOR_TYPES = ['ADMIN', 'USER'] as const

/** The two actor types are always offered, even when the backend reports none in its meta. */
export function actorTypeOptions(meta: ActivityMeta): readonly LogActorType[] {
  return meta.actorTypes.length > 0 ? meta.actorTypes : BOTH_ACTOR_TYPES
}

export function isRefusal(action: string) {
  return action === 'LOGIN_REFUSED' || action === 'ACCESS_REFUSED'
}

/**
 * A refusal is the one thing on this page that is not something someone successfully did, so it
 * is the one that has to stand out.
 */
export function activityActionColor(action: string) {
  if (isRefusal(action)) return 'red'
  if (action === 'USER_LOGIN' || action === 'USER_LOGOUT') return 'violet'
  if (action.endsWith('_REPORT_CREATED')) return 'orange'
  if (action === 'RATING_SUBMITTED') return 'yellow'
  return 'teal'
}

export function formatActivityValue(value: ActivityValue): string {
  if (value === null) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function text(value: ActivityValue): string {
  return typeof value === 'string' && value ? value : ''
}

/**
 * The one-line summary in the table's last column. Student activity carries a content preview
 * and a refusal carries why it was refused, so one column answers "what happened" for both.
 */
export function activitySummary(metadata: Record<string, ActivityValue>): string {
  const preview = text(metadata.contentPreview)
  if (preview) return preview

  const path = text(metadata.path)
  const reason = text(metadata.reason)
  if (reason) return path ? `${reason} · ${path}` : reason

  const method = text(metadata.method)
  if (path) return method ? `${method} ${path}` : path
  return method || '—'
}
