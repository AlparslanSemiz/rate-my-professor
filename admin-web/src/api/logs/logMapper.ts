import type { AuditEntry, AuditLog } from '@/domain/auditLog'
import type { BackendAuditLog, BackendLogEntry } from './logTypes'

/**
 * Fills in the two open maps a backend may not send.
 *
 * `changes` and `metadata` default to empty maps, which is the same `?? {}` the ratings mapper
 * uses for `scores` and for the same reason: they are open maps the panel walks with
 * `Object.keys` and `Object.entries`, and both throw on `undefined`. That is not a detail-view
 * problem — the row counts its own changed fields, so a single entry missing `changes` took
 * down **every row of the table** (`F-021`). An entry type that legitimately has neither, a
 * sign-in or a deletion, is exactly what a serializer omits. An empty map and an absent key
 * render identically, so nothing downstream has to test for absence.
 *
 * @param entry the entry as it arrived
 * @returns the entry with both maps guaranteed
 */
export function toLogEntry(entry: BackendLogEntry): AuditEntry {
  return {
    ...entry,
    changes: entry.changes ?? {},
    metadata: entry.metadata ?? {},
  }
}

/**
 * The same, plus the three fields only the audit log carries.
 *
 * They default to "not revertible, no reason, not yet reverted", so an older deployment serves
 * entries whose undo button is simply absent rather than one drawn from `undefined`. Nothing
 * maps an *activity* entry through here: what a student did in the app is not the panel's to
 * reverse, so those three fields are dropped rather than defaulted, even if the shared table
 * happens to report them.
 *
 * @param entry the entry as it arrived
 * @returns the entry with every field the audit screen reads guaranteed
 */
export function toAuditLog(entry: BackendAuditLog): AuditLog {
  return {
    ...toLogEntry(entry),
    revertible: entry.revertible ?? false,
    revertBlockedReason: entry.revertBlockedReason ?? null,
    revertedByAuditId: entry.revertedByAuditId ?? null,
  }
}
