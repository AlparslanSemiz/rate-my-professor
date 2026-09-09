import type { BasicResponse } from '@/api/client/ApiClient'
import type { AuditAction, AuditActorType, AuditLog, AuditMeta, AuditTargetType } from '@/domain/auditLog'

/**
 * The wire shapes of `/audit-logs`, and nothing else.
 *
 * This file used to also rename eleven domain types — `LogEntry` to `AuditLog`, `LogMeta` to
 * `AuditMeta`, and so on — which meant the feature layer read the same concepts under two
 * vocabularies and a rename travelled through three modules. The domain now uses the `Audit*`
 * names itself, since the activity log it was once shared with is gone (ADR 0002), and the
 * aliases went with the shim.
 */

/** One page of entries, with the cursor for the next (see ADR 0006). */
export interface AuditLogPage {
  readonly auditLogs: readonly AuditLog[]
  nextCursor: string | null
}

/**
 * As the entries arrive. The three revert fields are optional here and required on `AuditLog`:
 * a backend without them serves an entry that simply cannot be undone, rather than one whose
 * button is drawn from `undefined`.
 */
export type BackendAuditLog = Omit<
  AuditLog,
  'revertible' | 'revertBlockedReason' | 'revertedByAuditId' | 'changes' | 'metadata'
> &
  Partial<
    Pick<
      AuditLog,
      'revertible' | 'revertBlockedReason' | 'revertedByAuditId' | 'changes' | 'metadata'
    >
  >

/** `GET /audit-logs`. `nextCursor` is absent rather than null when no `limit` was sent. */
export interface AuditLogResponse extends BasicResponse {
  auditLogs: BackendAuditLog[]
  nextCursor?: string | null
}

/**
 * `GET /audit-logs/meta` — the vocabulary the filter dropdowns are built from.
 *
 * `actorTypes` is optional because a backend that predates it simply offers no actor-type
 * filter, rather than offering an empty one.
 */
export interface AuditMetaResponse extends BasicResponse {
  actors: AuditMeta['actors']
  readonly actions: readonly AuditAction[]
  targetTypes: AuditTargetType[]
  readonly actorTypes?: readonly AuditActorType[]
}
