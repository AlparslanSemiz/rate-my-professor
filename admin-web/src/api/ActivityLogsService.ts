import { apiClient, expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import {
  ACTIVITY_ACTIONS,
  LOG_TARGET_TYPES,
  endOfDay,
  startOfDay,
  type LogActor,
  type LogActorType,
  type LogChange,
  type LogEntry,
  type LogFilters,
  type LogMeta,
  type LogTarget,
  type LogTargetType,
  type LogValue,
} from '../domain/auditLog'

export { ACTIVITY_ACTIONS }
export const ACTIVITY_TARGET_TYPES = LOG_TARGET_TYPES

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number]
export type ActivityTargetType = LogTargetType
export type ActivityActorType = LogActorType
export type ActivityValue = LogValue
export type ActivityActor = LogActor
export type ActivityTarget = LogTarget
export type ActivityChange = LogChange
export type ActivityLog = LogEntry
export type ActivityLogFilters = LogFilters
export type ActivityMeta = LogMeta

export interface ActivityLogPage {
  activityLogs: ActivityLog[]
  nextCursor: string | null
}

interface ActivityLogResponse extends BasicResponse, ActivityLogPage {}
interface ActivityMetaResponse extends BasicResponse, ActivityMeta {}

const PAGE_SIZE = 50

/**
 * The activity half of the audit table: what users did in the student app, plus every refused
 * request. Same entry shape, cursor contract and query parameters as `/audit-logs`; only the
 * action vocabulary differs, and the filter dropdowns take it from `/activity-logs/meta`.
 */
export class ActivityLogsService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getLogs(
    filters: ActivityLogFilters = {},
    cursor?: string | null,
  ): Promise<ActivityLogPage> {
    const response = await this.client.get<ActivityLogResponse>('/activity-logs', {
      limit: PAGE_SIZE,
      cursor,
      q: filters.q?.trim(),
      actorId: filters.actorId,
      actorType: filters.actorType,
      action: filters.action,
      targetType: filters.targetType,
      from: startOfDay(filters.from),
      to: endOfDay(filters.to),
    })
    return {
      activityLogs: expectArray<ActivityLog>(response, 'activityLogs', 'GET /activity-logs'),
      nextCursor: response.nextCursor ?? null,
    }
  }

  async getMeta(): Promise<ActivityMeta> {
    const response = await this.client.get<ActivityMetaResponse>('/activity-logs/meta')
    return {
      actors: expectArray<ActivityMeta['actors'][number]>(response, 'actors', 'GET /activity-logs/meta'),
      actions: expectArray<ActivityAction>(response, 'actions', 'GET /activity-logs/meta'),
      targetTypes: expectArray<ActivityTargetType>(response, 'targetTypes', 'GET /activity-logs/meta'),
      actorTypes: response.actorTypes ?? [],
    }
  }
}

export const activityLogsService = new ActivityLogsService(apiClient)
