import { apiClient, expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import {
  ADMINISTRATIVE_ACTIONS,
  LOG_TARGET_TYPES,
  endOfDay,
  startOfDay,
  type LogActor,
  type LogActorType,
  type LogChange,
  type LogFilters,
  type LogMeta,
  type LogTarget,
  type LogTargetType,
  type LogValue,
  type RevertableLogEntry,
} from '../domain/auditLog'

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
type BackendAuditLog = Omit<AuditLog, 'revertible' | 'revertBlockedReason' | 'revertedByAuditId'> &
  Partial<Pick<AuditLog, 'revertible' | 'revertBlockedReason' | 'revertedByAuditId'>>

function toAuditLog(entry: BackendAuditLog): AuditLog {
  return {
    ...entry,
    revertible: entry.revertible ?? false,
    revertBlockedReason: entry.revertBlockedReason ?? null,
    revertedByAuditId: entry.revertedByAuditId ?? null,
  }
}

interface AuditLogResponse extends BasicResponse {
  auditLogs: BackendAuditLog[]
  nextCursor?: string | null
}
interface AuditMetaResponse extends BasicResponse, AuditMeta {}

const PAGE_SIZE = 50

export class AuditLogsService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getLogs(filters: AuditLogFilters = {}, cursor?: string | null): Promise<AuditLogPage> {
    const response = await this.client.get<AuditLogResponse>('/audit-logs', {
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
      auditLogs: expectArray<BackendAuditLog>(response, 'auditLogs', 'GET /audit-logs').map(toAuditLog),
      nextCursor: response.nextCursor ?? null,
    }
  }

  /**
   * Undoes the field edit an entry recorded. The response is `{success, message}` and nothing
   * else — no updated target, no id for the reversal — so the caller **must** re-read the log
   * afterwards: that is where the reversal's own entry appears, and where this entry starts
   * carrying `revertedByAuditId`.
   *
   * A refusal is a `409` whose `reason` says which of the five it is; it reaches the caller as
   * an `ApiError` carrying that reason.
   */
  revert(id: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>(`/audit-logs/${id}/revert`)
  }

  async getMeta(): Promise<AuditMeta> {
    const response = await this.client.get<AuditMetaResponse>('/audit-logs/meta')
    return {
      actors: expectArray<AuditMeta['actors'][number]>(response, 'actors', 'GET /audit-logs/meta'),
      actions: expectArray<AuditAction>(response, 'actions', 'GET /audit-logs/meta'),
      targetTypes: expectArray<AuditTargetType>(response, 'targetTypes', 'GET /audit-logs/meta'),
      actorTypes: response.actorTypes ?? [],
    }
  }
}

export const auditLogsService = new AuditLogsService(apiClient)
