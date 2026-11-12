import {
  activityLogsService,
  auditLogsService,
  type AuditEntry,
  type AuditLog,
  type AuditLogFilters,
  type AuditMeta,
  type LogPage,
} from '@/api/logs'
import { activityActionColor, auditActionColor } from '@/constants/colors'
import { activitySummary } from './activitySummary'
import { logEnumLabel, type LogErrorWording } from './logModel'
import { EMPTY_VALUE } from '@/utils/emptyValue'

/**
 * What one of the two log screens needs from its service. Narrower than either service — the
 * audit one also reverts, and the screen machinery has no business reaching that.
 */
export interface LogService<TEntry extends AuditEntry> {
  getLogs(filters?: AuditLogFilters, cursor?: string | null): Promise<LogPage<TEntry>>
  getMeta(): Promise<AuditMeta>
}

/**
 * Everything that differs between the audit log and the activity log.
 *
 * The two screens are one screen with two vocabularies: the same reader, the same filter bar,
 * the same table, the same row and the same details modal, over two halves of one backend
 * table separated by `actor.type`. Collecting the differences into one value is what keeps
 * that true — a component that asked "which log am I?" would be the second copy in disguise,
 * and there would be nowhere to look to find out what the two screens actually disagree about.
 *
 * What is deliberately **not** here is undoing. It is not a field on this record, because a
 * field would imply the activity screen could have one: the audit page composes
 * `RevertSection` into the details modal itself, and the activity page is typed on `AuditEntry`,
 * which carries no `revertible` for a control to read. See ADR 0016.
 */
export interface LogScreen<TEntry extends AuditEntry> {
  /** The page title, and the nav label. */
  readonly title: string
  /** The page description. Also the marker the accessibility and browser layers wait for. */
  readonly description: string
  /** Root of this screen's query keys, so the two screens never share a cache entry. */
  readonly queryKey: string
  readonly service: LogService<TEntry>
  /** Column headings, left to right. The last one is what {@link summarise} fills. */
  readonly columns: readonly string[]
  /** The last column's text for one entry, or `null` when this entry has nothing to say there. */
  readonly summarise: (entry: TEntry) => string | null
  /** What the last column reads when {@link summarise} answers `null`. */
  readonly emptySummary: string
  /** The action badge's colour, for a value that arrived from the wire unvalidated. */
  readonly actionColor: (action: unknown) => string
  /**
   * Whether the filter bar offers the actor-type select.
   *
   * Off for the audit log: every entry there is an administrative action, so the control would
   * narrow a list that is already narrowed. On for the activity log, where the same table
   * carries students and admins.
   */
  readonly offersActorTypeFilter: boolean
  readonly searchPlaceholder: string
  /** The actor select's label and placeholder — "Admin" on one screen, "Who" on the other. */
  readonly actorFilterLabel: string
  readonly actorFilterPlaceholder: string
  /**
   * The screen's own noun, lowercase-able, used wherever an accessible name has to say which
   * log it belongs to: "Audit start date", "Open audit event User Blocked by Admin User".
   */
  readonly noun: string
  /** The line above the table, which also says how many rows are loaded. */
  readonly countLabel: (count: number) => string
  readonly emptyMessage: string
  readonly errors: LogErrorWording
}

/** What admins did through the panel, and the one screen that can undo an entry. */
export const AUDIT_SCREEN: LogScreen<AuditLog> = Object.freeze({
  title: 'Audit Logs',
  description: 'A trace of successful admin actions, showing who changed what and when.',
  queryKey: 'audit-logs',
  service: auditLogsService,
  columns: ['Time', 'Admin', 'Action', 'Target', 'Changed fields'],
  summarise: (entry: AuditLog) => {
    const fields = Object.keys(entry.changes)
    return fields.length > 0 ? fields.map(logEnumLabel).join(', ') : null
  },
  emptySummary: 'No field changes',
  actionColor: auditActionColor,
  offersActorTypeFilter: false,
  searchPlaceholder: 'Admin, email, or target...',
  actorFilterLabel: 'Admin',
  actorFilterPlaceholder: 'All admins',
  noun: 'Audit',
  countLabel: (count: number) => `${count} audit event${count === 1 ? '' : 's'} loaded · newest first`,
  emptyMessage: 'No audit events match these filters.',
  errors: {
    unavailable:
      'The configured backend does not support audit logs yet. Deploy the audit API endpoints, then try again.',
    fallback: 'Failed to load audit logs',
  },
})

/**
 * What everyone else did in the app, and every request that was refused.
 *
 * Deleted on 2026-09-09 and back on 2026-09-10; ADR 0016 records why. The differences from the
 * audit screen are all here and all small: the "Who" filter, because one table carries
 * students and admins; a summary column instead of changed fields, because these entries
 * change nothing; and no undo, anywhere, which is not a field on this record at all.
 */
export const ACTIVITY_SCREEN: LogScreen<AuditEntry> = Object.freeze({
  title: 'Activity Logs',
  description:
    'Everything people do in the app: who signed in, what they posted or reported, and what was refused.',
  queryKey: 'activity-logs',
  service: activityLogsService,
  columns: ['Time', 'Who', 'Activity', 'Target', 'Detail'],
  summarise: (entry: AuditEntry) => activitySummary(entry.metadata),
  emptySummary: EMPTY_VALUE,
  actionColor: activityActionColor,
  offersActorTypeFilter: true,
  searchPlaceholder: 'Name, email, or target...',
  actorFilterLabel: 'Person',
  actorFilterPlaceholder: 'Everyone the backend lists',
  noun: 'Activity',
  countLabel: (count: number) => `${count} activity event${count === 1 ? '' : 's'} loaded · newest first`,
  emptyMessage: 'No activity matches these filters.',
  errors: {
    unavailable:
      'The configured backend does not track application activity yet. Deploy the activity log API endpoints, then try again.',
    fallback: 'Failed to load activity logs',
  },
})
