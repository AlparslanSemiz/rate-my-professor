import type { BasicResponse } from '@/api/client/ApiClient'
import type {
  AuditAction,
  AuditActorType,
  AuditEntry,
  AuditLog,
  AuditMeta,
  AuditTargetType,
} from '@/domain/auditLog'

/**
 * The wire shapes of the two log endpoints, and nothing else.
 *
 * This file used to also rename eleven domain types — `LogEntry` to `AuditLog`, `LogMeta` to
 * `AuditMeta`, and so on — which meant the feature layer read the same concepts under two
 * vocabularies and a rename travelled through three modules. The domain owns the names now and
 * the aliases went with the shim; the activity log is back (ADR 0016) reading *those* names
 * rather than a second set of its own.
 */

/**
 * One page of entries, with the cursor for the next (see ADR 0006).
 *
 * `entries` rather than `auditLogs`: the wire key is the backend's and belongs in
 * {@link LogResource}, and naming it here again would make a caller that pages both logs read
 * two different fields for the same thing.
 */
export interface LogPage<TEntry extends AuditEntry> {
  readonly entries: readonly TEntry[]
  nextCursor: string | null
}

/**
 * As the entries arrive. `changes` and `metadata` are optional here and required on the domain
 * types: a serializer that omits an empty map is exactly what `F-021` was.
 */
export type BackendLogEntry = Omit<AuditEntry, 'changes' | 'metadata'> &
  Partial<Pick<AuditEntry, 'changes' | 'metadata'>>

/**
 * As an audit entry arrives. The three revert fields are optional here and required on
 * `AuditLog`: a backend without them serves an entry that simply cannot be undone, rather than
 * one whose button is drawn from `undefined`.
 */
export type BackendAuditLog = BackendLogEntry &
  Partial<Pick<AuditLog, 'revertible' | 'revertBlockedReason' | 'revertedByAuditId'>>

/** `GET /audit-logs` and `GET /activity-logs`. `nextCursor` is absent rather than null when no `limit` was sent. */
export interface LogResponse extends BasicResponse {
  nextCursor?: string | null
}

/**
 * `GET /audit-logs/meta` and `GET /activity-logs/meta` — the vocabulary the filter dropdowns
 * are built from.
 *
 * `actorTypes` is optional because a backend that predates it simply offers no actor-type
 * filter, rather than offering an empty one.
 */
export interface LogMetaResponse extends BasicResponse {
  actors: AuditMeta['actors']
  readonly actions: readonly AuditAction[]
  targetTypes: AuditTargetType[]
  readonly actorTypes?: readonly AuditActorType[]
}
