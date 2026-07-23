import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../audit.mjs'
import {
  buildAuditLogQuery,
  encodeAuditCursor,
  parseAuditLogQuery,
} from '../audit-query.mjs'
import { requireAdmin } from '../auth-session.mjs'
import { query } from '../db.mjs'
import { sendJson } from '../http.mjs'
import { toAuditLog } from '../mappers.mjs'

export async function handleAuditLogs(req, res, parts) {
  const admin = await requireAdmin(req, res)
  if (!admin) return
  if (req.method !== 'GET') {
    return sendJson(res, 404, { message: 'Not found', success: false })
  }

  if (parts[1] === 'meta' && parts.length === 2) {
    return getAuditMetadata(res)
  }
  if (parts.length !== 1) {
    return sendJson(res, 404, { message: 'Not found', success: false })
  }
  return listAuditLogs(req, res)
}

async function getAuditMetadata(res) {
  const actors = await query(`
    SELECT DISTINCT ON (actor_id)
      actor_id AS id,
      actor_name AS name,
      actor_email AS email,
      actor_role AS role
    FROM mock_audit_logs
    WHERE actor_type = 'ADMIN' AND actor_id IS NOT NULL
    ORDER BY actor_id, created_at DESC
  `)
  return sendJson(res, 200, {
    message: 'Success',
    success: true,
    actors: actors.rows,
    actions: AUDIT_ACTIONS,
    targetTypes: AUDIT_TARGET_TYPES,
  })
}

async function listAuditLogs(req, res) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const parsed = parseAuditLogQuery(url)
  if (parsed.error) {
    return sendJson(res, 400, { message: parsed.error, success: false })
  }

  const filters = parsed.value
  const auditQuery = buildAuditLogQuery(filters)
  const result = await query(auditQuery.text, auditQuery.values)
  const hasNextPage = result.rows.length > filters.limit
  const rows = result.rows.slice(0, filters.limit)

  return sendJson(res, 200, {
    message: 'Success',
    success: true,
    auditLogs: rows.map(toAuditLog),
    nextCursor: hasNextPage && rows.length > 0 ? encodeAuditCursor(rows.at(-1)) : null,
  })
}
