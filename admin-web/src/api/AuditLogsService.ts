import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'

export const AUDIT_ACTIONS = [
  'ADMIN_LOGIN',
  'ADMIN_LOGOUT',
  'USER_WARNING_CREATED',
  'USER_BLOCKED',
  'USER_UNBLOCKED',
  'USER_DELETED',
  'COMMENT_REPORT_STATUS_CHANGED',
  'BUG_REPORT_UPDATED',
] as const

export const AUDIT_TARGET_TYPES = ['ADMIN_SESSION', 'USER', 'COMMENT_REPORT', 'BUG_REPORT'] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]
export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number]
export type AuditActorType = 'ADMIN' | 'USER'
export type AuditValue = string | number | boolean | null

export interface AuditActor {
  type: AuditActorType
  id: string
  name: string
  email: string
  role: string
}

export interface AuditTarget {
  type: AuditTargetType
  id: string
  label: string
}

export interface AuditChange {
  before: AuditValue
  after: AuditValue
}

export interface AuditLog {
  id: string
  action: AuditAction
  createdAt: string
  actor: AuditActor
  target: AuditTarget | null
  changes: Record<string, AuditChange>
  metadata: Record<string, AuditValue>
}

export interface AuditLogFilters {
  q?: string
  actorId?: string
  action?: AuditAction
  targetType?: AuditTargetType
  from?: string
  to?: string
}

export interface AuditLogPage {
  auditLogs: AuditLog[]
  nextCursor: string | null
}

export interface AuditMeta {
  actors: Array<Pick<AuditActor, 'id' | 'name' | 'email' | 'role'>>
  actions: AuditAction[]
  targetTypes: AuditTargetType[]
}

interface AuditLogResponse extends BasicResponse, AuditLogPage {}
interface AuditMetaResponse extends BasicResponse, AuditMeta {}

function startOfUtcDay(value?: string) {
  return value ? `${value}T00:00:00.000Z` : undefined
}

function endOfUtcDay(value?: string) {
  return value ? `${value}T23:59:59.999Z` : undefined
}

export class AuditLogsService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getLogs(filters: AuditLogFilters = {}, cursor?: string | null): Promise<AuditLogPage> {
    const response = await this.client.get<AuditLogResponse>('/audit-logs', {
      limit: 50,
      cursor,
      q: filters.q?.trim(),
      actorId: filters.actorId,
      action: filters.action,
      targetType: filters.targetType,
      from: startOfUtcDay(filters.from),
      to: endOfUtcDay(filters.to),
    })
    return {
      auditLogs: response.auditLogs,
      nextCursor: response.nextCursor,
    }
  }

  async getMeta(): Promise<AuditMeta> {
    const response = await this.client.get<AuditMetaResponse>('/audit-logs/meta')
    return {
      actors: response.actors,
      actions: response.actions,
      targetTypes: response.targetTypes,
    }
  }
}

export const auditLogsService = new AuditLogsService(apiClient)
