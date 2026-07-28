import { ACTIVITY_OUTCOMES, ACTIVITY_TARGET_TYPES, ACTIVITY_TYPES } from './activity.mjs'
import { decodeLogCursor } from './log-cursor.mjs'
import { isUuid } from './http.mjs'

export { decodeLogCursor, encodeLogCursor } from './log-cursor.mjs'

const VALID_TYPES = new Set(ACTIVITY_TYPES)
const VALID_TARGET_TYPES = new Set(ACTIVITY_TARGET_TYPES)
const VALID_OUTCOMES = new Set(ACTIVITY_OUTCOMES)

function parseTimestamp(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseLimit(searchParams) {
  const rawLimit = searchParams.get('limit')
  const limit = rawLimit === null ? 50 : Number(rawLimit)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return { error: 'Limit must be an integer between 1 and 100' }
  }
  return { value: limit }
}

function parseDateRange(searchParams) {
  const rawFrom = searchParams.get('from')
  const rawTo = searchParams.get('to')
  const from = parseTimestamp(rawFrom)
  const to = parseTimestamp(rawTo)
  if ((rawFrom && !from) || (rawTo && !to) || (from && to && from > to)) {
    return { error: 'Invalid activity date range' }
  }
  return { value: { from, to } }
}

function parseCursor(searchParams) {
  const rawCursor = searchParams.get('cursor')
  const cursor = rawCursor ? decodeLogCursor(rawCursor) : null
  if (rawCursor && !cursor) {
    return { error: 'Invalid activity cursor' }
  }
  return { value: cursor }
}

export function parseActivityLogQuery(url) {
  const { searchParams } = url
  const parsedLimit = parseLimit(searchParams)
  if (parsedLimit.error) return parsedLimit

  const actorId = searchParams.get('actorId')
  if (actorId && !isUuid(actorId)) {
    return { error: 'Invalid actor id' }
  }

  const type = searchParams.get('type')
  if (type && !VALID_TYPES.has(type)) {
    return { error: 'Invalid activity type' }
  }

  const targetType = searchParams.get('targetType')
  if (targetType && !VALID_TARGET_TYPES.has(targetType)) {
    return { error: 'Invalid activity target type' }
  }

  const outcome = searchParams.get('outcome')
  if (outcome && !VALID_OUTCOMES.has(outcome)) {
    return { error: 'Invalid activity outcome' }
  }

  const parsedDateRange = parseDateRange(searchParams)
  if (parsedDateRange.error) return parsedDateRange
  const parsedCursor = parseCursor(searchParams)
  if (parsedCursor.error) return parsedCursor

  return {
    value: {
      limit: parsedLimit.value,
      actorId,
      type,
      targetType,
      outcome,
      ...parsedDateRange.value,
      cursor: parsedCursor.value,
      search: String(searchParams.get('q') ?? '').trim(),
    },
  }
}

export function buildActivityLogQuery(filters) {
  const clauses = []
  const values = []
  const addClause = (sql, value) => {
    values.push(value)
    clauses.push(sql.replace('?', `$${values.length}`))
  }

  if (filters.actorId) addClause('actor_id = ?', filters.actorId)
  if (filters.type) addClause('type = ?', filters.type)
  if (filters.targetType) addClause('target_type = ?', filters.targetType)
  if (filters.outcome) addClause('outcome = ?', filters.outcome)
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
      FROM mock_activity_logs
      ${clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''}
      ORDER BY created_at DESC, id DESC
      LIMIT $${values.length}
    `,
    values,
  }
}
