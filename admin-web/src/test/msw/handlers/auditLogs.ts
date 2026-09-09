import { http } from 'msw'
import type { AuditLog } from '@/api/logs'
import { EMPTY_AUDIT_META } from '@/domain/auditLog'
import { apiUrl } from '../apiUrl'
import { db } from '../db'
import { CURSOR_WITHOUT_LIMIT_MESSAGE, failure, ok, paginate } from '../envelope'

/**
 * `/audit-logs`, with the filters applied and the pages really sliced.
 *
 * The filters matter here more than anywhere else in the panel, because the audit log is the
 * one screen that filters **server-side**: what a test proves about "applying a filter" is
 * entirely about the query string it produced, and under a service mock that string never
 * existed.
 */

function matches(entry: AuditLog, url: URL): boolean {
  const query = url.searchParams.get('q')?.trim().toLowerCase()
  const actorId = url.searchParams.get('actorId')
  const action = url.searchParams.get('action')
  const targetType = url.searchParams.get('targetType')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  if (query && !`${entry.actor.name} ${entry.target?.label ?? ''}`.toLowerCase().includes(query)) {
    return false
  }
  if (actorId && entry.actor.id !== actorId) return false
  if (action && entry.action !== action) return false
  if (targetType && entry.target?.type !== targetType) return false
  // Both bounds are inclusive instants, so a plain string comparison of ISO values is correct.
  if (from && entry.createdAt < from) return false
  if (to && entry.createdAt > to) return false
  return true
}

export const auditLogHandlers = [
  http.get(apiUrl('/audit-logs/meta'), () => ok({ ...(db.auditMeta ?? EMPTY_AUDIT_META) })),

  http.get(apiUrl('/audit-logs'), ({ request }) => {
    const url = new URL(request.url)
    const filtered = db.auditLogs.filter((entry) => matches(entry, url))

    const page = paginate(filtered, url, (entry) => entry.id)
    if (!page) return failure(400, CURSOR_WITHOUT_LIMIT_MESSAGE)

    return ok({ auditLogs: page.items, nextCursor: page.nextCursor })
  }),

  http.post(apiUrl('/audit-logs/:id/revert'), ({ params }) => {
    const entry = db.auditLogs.find((candidate) => candidate.id === params.id)
    if (!entry) return failure(404, 'No such entry')
    if (!entry.revertible) {
      return failure(409, 'This change cannot be undone.', entry.revertBlockedReason ?? undefined)
    }

    entry.revertible = false
    entry.revertedByAuditId = `${entry.id}-reverted`
    entry.revertBlockedReason = 'ALREADY_REVERTED'
    return ok({}, 'Reverted')
  }),
]
