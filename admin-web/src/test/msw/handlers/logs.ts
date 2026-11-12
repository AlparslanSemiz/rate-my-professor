import { http, type HttpHandler } from 'msw'
import type { AuditEntry, AuditLog, AuditMeta } from '@/api/logs'
import { EMPTY_AUDIT_META } from '@/domain/auditLog'
import { apiUrl } from '../apiUrl'
import { db } from '../db'
import { CURSOR_WITHOUT_LIMIT_MESSAGE, failure, ok, paginate } from '../envelope'

/**
 * `/audit-logs` and `/activity-logs`, with the filters applied and the pages really sliced.
 *
 * The filters matter here more than anywhere else in the panel, because the logs are the only
 * screens that filter **server-side**: what a test proves about "applying a filter" is entirely
 * about the query string it produced, and under a service mock that string never existed.
 *
 * One set of handlers over both nouns, for the same reason `contentHandlers` serves comments
 * and answers from one function: the two endpoints are one implementation with the path and
 * the response key filled in. Reverting is the exception, and it is only mounted on the audit
 * path — a `POST /activity-logs/{id}/revert` has no handler and would fail the suite loudly,
 * which is the right answer to a panel that tried it.
 */

function matches(entry: AuditEntry, url: URL): boolean {
  const query = url.searchParams.get('q')?.trim().toLowerCase()
  const actorId = url.searchParams.get('actorId')
  const actorType = url.searchParams.get('actorType')
  const action = url.searchParams.get('action')
  const targetType = url.searchParams.get('targetType')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  if (query && !`${entry.actor.name} ${entry.target?.label ?? ''}`.toLowerCase().includes(query)) {
    return false
  }
  if (actorId && entry.actor.id !== actorId) return false
  if (actorType && entry.actor.type !== actorType) return false
  if (action && entry.action !== action) return false
  if (targetType && entry.target?.type !== targetType) return false
  // Both bounds are inclusive instants, so a plain string comparison of ISO values is correct.
  if (from && entry.createdAt < from) return false
  if (to && entry.createdAt > to) return false
  return true
}

/**
 * @param path the log's path, without the base
 * @param listKey the key its page arrives under, which is also what the panel reads
 * @param read the store's collection and meta for this log, read per request so a `seedDb`
 *             between tests is picked up
 */
function logHandlers(
  path: string,
  listKey: string,
  read: () => { entries: AuditEntry[]; meta: AuditMeta | null },
): HttpHandler[] {
  return [
    http.get(apiUrl(`${path}/meta`), () => ok({ ...(read().meta ?? EMPTY_AUDIT_META) })),

    http.get(apiUrl(path), ({ request }) => {
      const url = new URL(request.url)
      const filtered = read().entries.filter((entry) => matches(entry, url))

      const page = paginate(filtered, url, (entry) => entry.id)
      if (!page) return failure(400, CURSOR_WITHOUT_LIMIT_MESSAGE)

      return ok({ [listKey]: page.items, nextCursor: page.nextCursor })
    }),
  ]
}

const revertHandler = http.post(apiUrl('/audit-logs/:id/revert'), ({ params }) => {
  const entry = db.auditLogs.find((candidate) => candidate.id === params.id)
  if (!entry) return failure(404, 'No such entry')
  if (!entry.revertible) {
    return failure(409, 'This change cannot be undone.', entry.revertBlockedReason ?? undefined)
  }

  entry.revertible = false
  entry.revertedByAuditId = `${entry.id}-reverted`
  entry.revertBlockedReason = 'ALREADY_REVERTED'
  return ok({}, 'Reverted')
})

export const auditLogHandlers: HttpHandler[] = [
  ...logHandlers('/audit-logs', 'auditLogs', () => ({
    entries: db.auditLogs as AuditLog[],
    meta: db.auditMeta,
  })),
  revertHandler,
]

export const activityLogHandlers: HttpHandler[] = logHandlers(
  '/activity-logs',
  'activityLogs',
  () => ({ entries: db.activityLogs, meta: db.activityMeta }),
)
