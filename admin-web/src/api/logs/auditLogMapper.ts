import type { AuditLog } from '@/domain/auditLog'
import type { BackendAuditLog } from './auditLogTypes'

/**
 * Fills in the fields a backend may not send.
 *
 * The three revert fields default to "not revertible, no reason, not yet reverted", so an
 * older deployment serves entries whose undo button is simply absent rather than one drawn
 * from `undefined`.
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
 * @returns the entry with every field the screens read guaranteed
 */
export function toAuditLog(entry: BackendAuditLog): AuditLog {
  return {
    ...entry,
    revertible: entry.revertible ?? false,
    revertBlockedReason: entry.revertBlockedReason ?? null,
    revertedByAuditId: entry.revertedByAuditId ?? null,
    changes: entry.changes ?? {},
    metadata: entry.metadata ?? {},
  }
}
