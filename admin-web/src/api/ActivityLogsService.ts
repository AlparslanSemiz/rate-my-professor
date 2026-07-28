import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'

export const ACTIVITY_OUTCOMES = ['SUCCESS', 'FAILURE', 'DENIED'] as const

export type ActivityOutcome = (typeof ACTIVITY_OUTCOMES)[number]
export type ActivityActorType = 'ADMIN' | 'USER'
export type ActivityValue = string | number | boolean | null

/**
 * Activity types and target types are deliberately plain strings: unlike the fixed set of
 * admin audit actions, the student app keeps gaining new tracked actions. The filter
 * dropdowns are driven by `/activity-logs/meta` so a new backend type shows up without a
 * frontend release.
 */
export type ActivityType = string
export type ActivityTargetType = string

export interface ActivityActor {
  type: ActivityActorType
  id: string
  name: string
  email: string
  role: string
}

export interface ActivityTarget {
  type: ActivityTargetType
  id: string
  label: string
}

/** Where the action happened. Every field is optional: anonymous events carry very little. */
export interface ActivityContext {
  route?: string | null
  method?: string | null
  ip?: string | null
  userAgent?: string | null
}

export interface ActivityLog {
  id: string
  type: ActivityType
  createdAt: string
  /** Null for unauthenticated events, e.g. a failed login for an unknown email. */
  actor: ActivityActor | null
  target: ActivityTarget | null
  context: ActivityContext | null
  metadata: Record<string, ActivityValue>
  outcome: ActivityOutcome
}

export interface ActivityLogFilters {
  q?: string
  actorId?: string
  type?: ActivityType
  targetType?: ActivityTargetType
  outcome?: ActivityOutcome
  from?: string
  to?: string
}

export interface ActivityLogPage {
  activities: ActivityLog[]
  nextCursor: string | null
}

export interface ActivityMeta {
  actors: Array<Pick<ActivityActor, 'id' | 'name' | 'email' | 'role'>>
  types: ActivityType[]
  targetTypes: ActivityTargetType[]
  outcomes: ActivityOutcome[]
}

interface ActivityLogResponse extends BasicResponse, ActivityLogPage {}
interface ActivityMetaResponse extends BasicResponse, ActivityMeta {}

const PAGE_SIZE = 50

function startOfUtcDay(value?: string) {
  return value ? `${value}T00:00:00.000Z` : undefined
}

function endOfUtcDay(value?: string) {
  return value ? `${value}T23:59:59.999Z` : undefined
}

export class ActivityLogsService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getLogs(filters: ActivityLogFilters = {}, cursor?: string | null): Promise<ActivityLogPage> {
    const response = await this.client.get<ActivityLogResponse>('/activity-logs', {
      limit: PAGE_SIZE,
      cursor,
      q: filters.q?.trim(),
      actorId: filters.actorId,
      type: filters.type,
      targetType: filters.targetType,
      outcome: filters.outcome,
      from: startOfUtcDay(filters.from),
      to: endOfUtcDay(filters.to),
    })
    return {
      activities: response.activities,
      nextCursor: response.nextCursor,
    }
  }

  async getMeta(): Promise<ActivityMeta> {
    const response = await this.client.get<ActivityMetaResponse>('/activity-logs/meta')
    return {
      actors: response.actors,
      types: response.types,
      targetTypes: response.targetTypes,
      outcomes: response.outcomes,
    }
  }
}

export const activityLogsService = new ActivityLogsService(apiClient)
