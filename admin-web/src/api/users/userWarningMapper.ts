import type { Warning } from './userTypes'

/** A warning as it arrives, with the issuer nested under `createdFrom`. */
export interface BackendWarning {
  id?: string
  userID: string
  message: string
  createdAt: string
  createdFrom: { id: string; name?: string; createdAt: string } | null
}

const UNKNOWN_ISSUER = 'Unknown'

/**
 * Lifts the issuer out of its nesting and fills in what may be missing.
 *
 * An issuer the backend cannot name becomes "Unknown" rather than an empty line, and an
 * absent id becomes an empty string — the history still renders, and "did I issue this?"
 * simply answers no.
 *
 * @param warning the warning as it arrived
 * @returns the warning as the history renders it
 */
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
