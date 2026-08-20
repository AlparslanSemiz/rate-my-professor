import { apiClient, expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import {
  ADMINISTRATIVE_ACTIONS,
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

export const AUDIT_ACTIONS = ADMINISTRATIVE_ACTIONS
export const AUDIT_TARGET_TYPES = LOG_TARGET_TYPES

export type AuditAction = (typeof ADMINISTRATIVE_ACTIONS)[number]
export type AuditTargetType = LogTargetType
export type AuditActorType = LogActorType
export type AuditValue = LogValue
export type AuditActor = LogActor
export type AuditTarget = LogTarget
export type AuditChange = LogChange
export type AuditLog = LogEntry
export type AuditLogFilters = LogFilters
export type AuditMeta = LogMeta

export interface AuditLogPage {
  auditLogs: AuditLog[]
  nextCursor: string | null
}

interface AuditLogResponse extends BasicResponse, AuditLogPage {}
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
      auditLogs: expectArray<AuditLog>(response, 'auditLogs', 'GET /audit-logs'),
      nextCursor: response.nextCursor ?? null,
    }
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
