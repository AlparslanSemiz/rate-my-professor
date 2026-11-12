import type { AuditEntry, AuditValue } from '@/api/logs'

/**
 * The activity log's last column: one line saying what actually happened.
 *
 * Activity entries change nothing, so `changes` is always empty and the audit log's "changed
 * fields" column would read the same on every row. What varies is `metadata`, and it varies by
 * action: a contribution carries a preview of what was written, a refusal carries why and
 * where. One column answers "what happened" for both, in that order of preference.
 *
 * Free-form on purpose. The backend documents `contentPreview`, `reason`, `path` and `method`
 * for the actions it has today; a key this function has never heard of is shown in full in the
 * details modal rather than guessed at here.
 */

/** @returns the value when it is a non-empty string, and an empty string otherwise */
function text(value: AuditValue | undefined): string {
  return typeof value === 'string' && value ? value : ''
}

/**
 * @param metadata whatever the backend recorded alongside the action
 * @returns the one-line summary, or `null` when nothing in there says anything
 */
export function activitySummary(metadata: AuditEntry['metadata']): string | null {
  const preview = text(metadata.contentPreview)
  if (preview) return preview

  const path = text(metadata.path)
  const reason = text(metadata.reason)
  if (reason) return path ? `${reason} · ${path}` : reason

  const method = text(metadata.method)
  if (path) return method ? `${method} ${path}` : path
  return method || null
}
