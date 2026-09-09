import type { Warning } from './userTypes'

export interface BackendWarning {
  id?: string
  userID: string
  message: string
  createdAt: string
  createdFrom: { id: string; name?: string; createdAt: string } | null
}

const UNKNOWN_ISSUER = 'Unknown'

export function toWarning(warning: BackendWarning): Warning {
  return {
    id: warning.id ?? null,
    userID: warning.userID,
    message: warning.message,
    createdAt: warning.createdAt,
    issuedBy: warning.createdFrom?.id ?? '',
    issuedByName: warning.createdFrom?.name?.trim() || UNKNOWN_ISSUER,
  }
}
