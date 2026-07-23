import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from './audit.mjs'
import { iso, isUuid } from './http.mjs'

const VALID_AUDIT_ACTIONS = new Set(AUDIT_ACTIONS)
const VALID_AUDIT_TARGET_TYPES = new Set(AUDIT_TARGET_TYPES)

export function encodeAuditCursor(row) {
  return Buffer.from(JSON.stringify({ createdAt: iso(row.created_at), id: row.id })).toString(
    'base64url',
  )
}

export function decodeAuditCursor(value) {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (!isUuid(parsed.id) || Number.isNaN(new Date(parsed.createdAt).getTime())) return null
    return parsed
  } catch {
    return null
  }
}

function parseTimestamp(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function parseAuditLogQuery(url) {
  const rawLimit = url.searchParams.get('limit')
  const limit = rawLimit === null ? 50 : Number(rawLimit)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return { error: 'Limit must be an integer between 1 and 100' }
  }

  const actorId = url.searchParams.get('actorId')
  if (actorId && !isUuid(actorId)) {
    return { error: 'Invalid actor id' }
  }

  const action = url.searchParams.get('action')
  if (action && !VALID_AUDIT_ACTIONS.has(action)) {
    return { error: 'Invalid audit action' }
  }

  const targetType = url.searchParams.get('targetType')
  if (targetType && !VALID_AUDIT_TARGET_TYPES.has(targetType)) {
    return { error: 'Invalid audit target type' }
  }

  const rawFrom = url.searchParams.get('from')
  const rawTo = url.searchParams.get('to')
  const from = parseTimestamp(rawFrom)
  const to = parseTimestamp(rawTo)
  if ((rawFrom && !from) || (rawTo && !to) || (from && to && from > to)) {
    return { error: 'Invalid audit date range' }
  }

  const rawCursor = url.searchParams.get('cursor')
  const cursor = rawCursor ? decodeAuditCursor(rawCursor) : null
  if (rawCursor && !cursor) {
    return { error: 'Invalid audit cursor' }
  }

  return {
    value: {
      limit,
      actorId,
      action,
      targetType,
      from,
      to,
      cursor,
      search: String(url.searchParams.get('q') ?? '').trim(),
    },
  }
}

export function buildAuditLogQuery(filters) {
  const clauses = []
  const values = []
  const addClause = (sql, value) => {
    values.push(value)
    clauses.push(sql.replace('?', `$${values.length}`))
  }

  if (filters.actorId) addClause('actor_id = ?', filters.actorId)
  if (filters.action) addClause('action = ?', filters.action)
  if (filters.targetType) addClause('target_type = ?', filters.targetType)
  if (filters.from) addClause('created_at >= ?', filters.from)
  if (filters.to) addClause('created_at <= ?', filters.to)

  if (filters.search) {
    values.push(`%${filters.search}%`)
    clauses.push(
      `(actor_name ILIKE $${values.length} OR actor_email ILIKE $${values.length} OR target_label ILIKE $${values.length})`,
    )
  }

  if (filters.cursor) {
    values.push(filters.cursor.createdAt, filters.cursor.id)
    clauses.push(`(created_at, id) < ($${values.length - 1}, $${values.length})`)
  }

  values.push(filters.limit + 1)
  return {
    text: `
      SELECT *
      FROM mock_audit_logs
      ${clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''}
      ORDER BY created_at DESC, id DESC
      LIMIT $${values.length}
    `,
    values,
  }
}
