import type { AuditLog, BackendAuditLog } from './auditLogTypes'

export function toAuditLog(entry: BackendAuditLog): AuditLog {
  return {
    ...entry,
    revertible: entry.revertible ?? false,
    revertBlockedReason: entry.revertBlockedReason ?? null,
    revertedByAuditId: entry.revertedByAuditId ?? null,
  }
}
