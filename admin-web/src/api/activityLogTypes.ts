import type { BasicResponse } from './ApiClient'
import {
  ACTIVITY_ACTIONS,
  LOG_TARGET_TYPES,
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

export interface ActivityLogResponse extends BasicResponse {
  activityLogs: ActivityLog[]
  nextCursor?: string | null
}

export interface ActivityMetaResponse extends BasicResponse {
  actors: ActivityMeta['actors']
  actions: ActivityAction[]
  targetTypes: ActivityTargetType[]
  actorTypes?: ActivityActorType[]
}
