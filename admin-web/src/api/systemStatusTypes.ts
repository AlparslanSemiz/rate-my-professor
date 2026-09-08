export const SYSTEM_HEALTH_VALUES = ['OK', 'DEGRADED', 'DOWN'] as const

export type SystemHealth = (typeof SYSTEM_HEALTH_VALUES)[number]

export interface DatabaseStatus {
  reachable: boolean
  latencyMs: number | null
  error: string | null
}

export interface LastWrite {
  at: string
  ageSeconds: number
  action: string
  actorName: string
}

export interface SystemStatus {
  status: SystemHealth
  checkedAt: string
  startedAt: string | null
  uptimeSeconds: number | null
  database: DatabaseStatus
  counts: Record<string, number> | null
  lastWrite: LastWrite | null
  gitlabEnabled: boolean
}
