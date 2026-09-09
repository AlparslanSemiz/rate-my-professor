/**
 * Which of the two logs a reader is pointed at.
 *
 * `/audit-logs` and `/activity-logs` are two halves of one backend table, separated by
 * `actor.type`. They take the same query parameters, page on the same cursor and return the
 * same entry shape; the path and the key the list arrives under are the whole difference. So
 * the difference is one value rather than a second copy of the reader — the same reasoning
 * `ContentService` already applies to `/comments` and `/answers`.
 *
 * The two are not derivable from each other: the path is kebab-cased and the key is camel,
 * and inventing a conversion would put a naming rule in the panel that the backend never
 * promised. Both are written down.
 */
export interface LogResource {
  /** The path, without the base. */
  readonly path: string
  /** The key the page's list arrives under in the response body. */
  readonly listKey: string
}

/** What admins did through the panel. */
export const AUDIT_LOG_RESOURCE: LogResource = Object.freeze({
  path: '/audit-logs',
  listKey: 'auditLogs',
})

/** What students did in the app, plus every refused request. */
export const ACTIVITY_LOG_RESOURCE: LogResource = Object.freeze({
  path: '/activity-logs',
  listKey: 'activityLogs',
})
