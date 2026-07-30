import { LOG_ACTOR_TYPES, LOG_TARGET_TYPES } from '../audit.mjs'
import { buildAuditLogQuery, encodeAuditCursor, parseAuditLogQuery } from '../audit-query.mjs'
import { requireAdmin } from '../auth-session.mjs'
import { query } from '../db.mjs'
import { sendJson } from '../http.mjs'
import { toAuditLog } from '../mappers.mjs'

/**
 * Serves one of the two log endpoints. They read the same table with the same query
 * parameters and cursor contract, and differ only in which actions they cover and what the
 * array of entries is called.
 */
export function createLogHandler({ scopeActions, arrayKey, adminActorsOnly }) {
  return async function handleLogs(req, res, parts) {
    const admin = await requireAdmin(req, res)
    if (!admin) return
    if (req.method !== 'GET') {
      return sendJson(res, 404, { message: 'Not found', success: false })
    }

    if (parts[1] === 'meta' && parts.length === 2) {
      return getMetadata(res, scopeActions, adminActorsOnly)
    }
    if (parts.length !== 1) {
      return sendJson(res, 404, { message: 'Not found', success: false })
    }
    return listLogs(req, res, scopeActions, arrayKey)
  }
}

async function getMetadata(res, scopeActions, adminActorsOnly) {
  // Every account that ever signed in is an actor in the activity log, so the list is capped
  // and `q` is what finds an actor beyond it.
  const actors = await query(
    `
      SELECT DISTINCT ON (actor_id)
        actor_id AS id,
        actor_name AS name,
        actor_email AS email,
        actor_role AS role
      FROM mock_audit_logs
      WHERE actor_id IS NOT NULL
        AND action = ANY($1)
        ${adminActorsOnly ? "AND actor_type = 'ADMIN'" : ''}
      ORDER BY actor_id, created_at DESC
      LIMIT 100
    `,
    [scopeActions],
  )

  return sendJson(res, 200, {
    message: 'Success',
    success: true,
    actors: actors.rows,
    actions: scopeActions,
    targetTypes: LOG_TARGET_TYPES,
    actorTypes: LOG_ACTOR_TYPES,
  })
}

async function listLogs(req, res, scopeActions, arrayKey) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const parsed = parseAuditLogQuery(url, scopeActions)
  if (parsed.error) {
    return sendJson(res, 400, { message: parsed.error, success: false })
  }

  const filters = parsed.value
  const logQuery = buildAuditLogQuery(filters)
  const result = await query(logQuery.text, logQuery.values)
  const hasNextPage = result.rows.length > filters.limit
  const rows = result.rows.slice(0, filters.limit)

  return sendJson(res, 200, {
    message: 'Success',
    success: true,
    [arrayKey]: rows.map(toAuditLog),
    nextCursor: hasNextPage && rows.length > 0 ? encodeAuditCursor(rows.at(-1)) : null,
  })
}
