import { ACTIVITY_OUTCOMES, ACTIVITY_TARGET_TYPES, ACTIVITY_TYPES } from '../activity.mjs'
import { buildActivityLogQuery, encodeLogCursor, parseActivityLogQuery } from '../activity-query.mjs'
import { requireAdmin } from '../auth-session.mjs'
import { query } from '../db.mjs'
import { sendJson } from '../http.mjs'
import { toActivityLog } from '../mappers.mjs'

export async function handleActivityLogs(req, res, parts) {
  const admin = await requireAdmin(req, res)
  if (!admin) return
  if (req.method !== 'GET') {
    return sendJson(res, 404, { message: 'Not found', success: false })
  }

  if (parts[1] === 'meta' && parts.length === 2) {
    return getActivityMetadata(res)
  }
  if (parts.length !== 1) {
    return sendJson(res, 404, { message: 'Not found', success: false })
  }
  return listActivityLogs(req, res)
}

async function getActivityMetadata(res) {
  const actors = await query(`
    SELECT DISTINCT ON (actor_id)
      actor_id AS id,
      actor_name AS name,
      actor_email AS email,
      actor_role AS role
    FROM mock_activity_logs
    WHERE actor_id IS NOT NULL
    ORDER BY actor_id, created_at DESC
  `)
  return sendJson(res, 200, {
    message: 'Success',
    success: true,
    actors: actors.rows,
    types: ACTIVITY_TYPES,
    targetTypes: ACTIVITY_TARGET_TYPES,
    outcomes: ACTIVITY_OUTCOMES,
  })
}

async function listActivityLogs(req, res) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const parsed = parseActivityLogQuery(url)
  if (parsed.error) {
    return sendJson(res, 400, { message: parsed.error, success: false })
  }

  const filters = parsed.value
  const activityQuery = buildActivityLogQuery(filters)
  const result = await query(activityQuery.text, activityQuery.values)
  const hasNextPage = result.rows.length > filters.limit
  const rows = result.rows.slice(0, filters.limit)

  return sendJson(res, 200, {
    message: 'Success',
    success: true,
    activities: rows.map(toActivityLog),
    nextCursor: hasNextPage && rows.length > 0 ? encodeLogCursor(rows.at(-1)) : null,
  })
}
