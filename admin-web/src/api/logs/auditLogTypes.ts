import type { BasicResponse } from '@/api/client/ApiClient'
import {
  ADMINISTRATIVE_ACTIONS,
  LOG_TARGET_TYPES,
  type LogActor,
  type LogActorType,
  type LogChange,
  type LogFilters,
  type LogMeta,
  type LogTarget,
  type LogTargetType,
  type LogValue,
  type RevertableLogEntry,
} from '@/domain/auditLog'

export const AUDIT_ACTIONS = ADMINISTRATIVE_ACTIONS
export const AUDIT_TARGET_TYPES = LOG_TARGET_TYPES

export type AuditAction = (typeof ADMINISTRATIVE_ACTIONS)[number]
export type AuditTargetType = LogTargetType
export type AuditActorType = LogActorType
export type AuditValue = LogValue
export type AuditActor = LogActor
export type AuditTarget = LogTarget
export type AuditChange = LogChange
export type AuditLog = RevertableLogEntry
export type AuditLogFilters = LogFilters
export type AuditMeta = LogMeta

export interface AuditLogPage {
  auditLogs: AuditLog[]
  nextCursor: string | null
}

/**
 * As the entries arrive. The three revert fields are optional here and required on `AuditLog`:
 * a backend without them serves an entry that simply cannot be undone, rather than one whose
 * button is drawn from `undefined`.
 */
export type BackendAuditLog = Omit<AuditLog, 'revertible' | 'revertBlockedReason' | 'revertedByAuditId'> &
  Partial<Pick<AuditLog, 'revertible' | 'revertBlockedReason' | 'revertedByAuditId'>>

export interface AuditLogResponse extends BasicResponse {
  auditLogs: BackendAuditLog[]
  nextCursor?: string | null
}

export interface AuditMetaResponse extends BasicResponse {
  actors: AuditMeta['actors']
  actions: AuditAction[]
  targetTypes: AuditTargetType[]
  actorTypes?: AuditActorType[]
}
