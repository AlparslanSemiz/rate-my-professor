import crypto from 'node:crypto'
import http from 'node:http'
import { apiConfig, demoAdminToken, demoLoginCode } from './config.mjs'
import { closePool, query, withTransaction } from './db.mjs'
import { ensureMockDatabase } from './seed.mjs'
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
  adminActor,
  insertAuditLog,
  userTarget,
} from './audit.mjs'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

// Shared SELECT used by both the user list and single-user lookup so the stats
// subqueries stay in one place.
const USER_WITH_STATS_SELECT = `
  SELECT
    u.*,
    (SELECT count(*) FROM mock_warnings w WHERE w.user_id = u.id) AS warnings,
    (SELECT count(*) FROM mock_comment_reports r WHERE r.reported_user_id = u.id) AS reports
  FROM mock_users u
`

const requiredAdmins = {
  'u-kisi4@student.kit.edu': 'Alparslan',
  'u-kisi5@student.kit.edu': 'Mustafa',
  'u-kisi6@student.kit.edu': 'Luis',
  'u-kisi7@student.kit.edu': 'Yavuz',
  'u-kisi8@student.kit.edu': 'Philipp',
}

const validReportStatuses = new Set(['OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'])
const validSeverities = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
const validAuditActions = new Set(AUDIT_ACTIONS)
const validAuditTargetTypes = new Set(AUDIT_TARGET_TYPES)

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function isRequiredAdminEmail(email) {
  return Object.hasOwn(requiredAdmins, normalizeEmail(email))
}

function corsHeaders(res) {
  return {
    'Access-Control-Allow-Origin': res.req.headers.origin ?? '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type,Accept,Origin,X-Requested-With',
    Vary: 'Origin',
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...corsHeaders(res) })
  res.end(JSON.stringify(body))
}

function sendNoContent(res) {
  res.writeHead(204, corsHeaders(res))
  res.end()
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf8')
  if (!text) return {}
  return JSON.parse(text)
}

function getPathParts(url) {
  return url.pathname.split('/').filter(Boolean)
}

function iso(value) {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function toUser(row) {
  return {
    id: row.id,
    username: row.username,
    kitEmail: row.kit_email,
    role: row.role,
    status: row.status,
    joined: iso(row.joined),
    lastOnline: iso(row.last_online),
    biography: row.biography ?? '',
    warnings: Number(row.warnings ?? 0),
    reports: Number(row.reports ?? 0),
  }
}

function toCommentUser(row, prefix) {
  return {
    id: row[`${prefix}_id`],
    name: row[`${prefix}_name`],
    role: row[`${prefix}_role`],
    warnings: Number(row[`${prefix}_warnings`] ?? 0),
    status: row[`${prefix}_status`],
  }
}

function toAuditLog(row) {
  return {
    id: row.id,
    action: row.action,
    createdAt: iso(row.created_at),
    actor: {
      type: row.actor_type,
      id: row.actor_id,
      name: row.actor_name,
      email: row.actor_email,
      role: row.actor_role,
    },
    target: row.target_type
      ? {
          type: row.target_type,
          id: row.target_id,
          label: row.target_label,
        }
      : null,
    changes: row.changes ?? {},
    metadata: row.metadata ?? {},
  }
}

async function findUserWithStatsById(id) {
  const result = await query(`${USER_WITH_STATS_SELECT} WHERE u.id = $1`, [id])
  return result.rows[0] ? toUser(result.rows[0]) : null
}

async function authenticatedUser(req) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice('Bearer '.length)
  const result = await query(
    `
      SELECT u.*
      FROM mock_tokens t
      JOIN mock_users u ON u.id = t.user_id
      WHERE t.value = $1
        AND t.revoked = false
        AND t.expires_at > now()
    `,
    [token]
  )
  return result.rows[0] ?? null
}

async function requireAdmin(req, res) {
  const user = await authenticatedUser(req)
  if (!user) {
    sendJson(res, 401, { message: 'Not logged in', success: false })
    return null
  }
  if (user.role !== 'ADMIN') {
    sendJson(res, 403, { message: 'Could not authenticate Admin', success: false })
    return null
  }
  return user
}

async function ensureUserForEmail(email, client) {
  const normalizedEmail = normalizeEmail(email)
  const existing = await client.query('SELECT * FROM mock_users WHERE kit_email = $1', [normalizedEmail])
  if (existing.rows[0]) return existing.rows[0]

  const username = requiredAdmins[normalizedEmail] ?? normalizedEmail.split('@')[0]
  const role = isRequiredAdminEmail(normalizedEmail) ? 'ADMIN' : 'STUDENT'
  const id = crypto.randomUUID()
  const result = await client.query(
    `
      INSERT INTO mock_users (id, username, kit_email, role, status, joined, last_online, biography)
      VALUES ($1, $2, $3, $4, 'ACTIVE', now(), now(), 'Created by local mock login.')
      RETURNING *
    `,
    [id, username, normalizedEmail, role]
  )
  return result.rows[0]
}

async function issueTokenForUser(user, client) {
  const value = user.kit_email === 'u-kisi4@student.kit.edu' ? demoAdminToken : crypto.randomUUID()
  await client.query(
    `
      INSERT INTO mock_tokens (value, user_id, expires_at, revoked)
      VALUES ($1, $2, now() + interval '365 days', false)
      ON CONFLICT (value)
      DO UPDATE SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at, revoked = false
    `,
    [value, user.id]
  )
  return value
}

async function handleAuth(req, res, parts) {
  if (req.method === 'POST' && parts[1] === 'request-login') {
    const body = await readBody(req)
    const email = normalizeEmail(body.email)
    if (!email) return sendJson(res, 400, { message: 'Error, Email is required', success: false })
    if (!email.endsWith('@student.kit.edu')) {
      return sendJson(res, 400, { message: "Email must end with '@student.kit.edu'", success: false })
    }

    await query(
      `
        INSERT INTO mock_login_codes (email, code, expires_at)
        VALUES ($1, $2, now() + interval '1 day')
        ON CONFLICT (email)
        DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at
      `,
      [email, demoLoginCode]
    )
    return sendJson(res, 200, { message: `Demo login code is ${demoLoginCode}`, success: true })
  }

  if (req.method === 'POST' && parts[1] === 'login') {
    const body = await readBody(req)
    const email = normalizeEmail(body.email)
    const loginToken = String(body.loginToken ?? '').trim()
    if (!email) return sendJson(res, 400, { message: 'Error, Email is required', success: false, authToken: null })
    if (!loginToken) return sendJson(res, 400, { message: 'Error, login token is required', success: false, authToken: null })

    const code = await query(
      'SELECT * FROM mock_login_codes WHERE email = $1 AND code = $2 AND expires_at > now()',
      [email, loginToken]
    )
    if (!code.rows[0] && loginToken !== demoLoginCode) {
      return sendJson(res, 200, { message: 'Invalid token', success: false, authToken: null })
    }

    const authToken = await withTransaction(async (client) => {
      const authenticated = await ensureUserForEmail(email, client)
      const issuedToken = await issueTokenForUser(authenticated, client)

      if (authenticated.role === 'ADMIN') {
        await insertAuditLog(client, {
          actor: adminActor(authenticated),
          action: 'ADMIN_LOGIN',
          target: {
            type: 'ADMIN_SESSION',
            id: authenticated.id,
            label: `${authenticated.username} admin session`,
          },
          changes: {
            authenticated: { before: false, after: true },
          },
          metadata: {
            method: 'EMAIL_OTP',
          },
        })
      }

      return issuedToken
    })
    return sendJson(res, 200, { message: 'Login successful', success: true, authToken })
  }

  if (req.method === 'POST' && parts[1] === 'logout') {
    const admin = await requireAdmin(req, res)
    if (!admin) return
    const token = req.headers.authorization.slice('Bearer '.length)

    await withTransaction(async (client) => {
      const revoked = await client.query(
        'UPDATE mock_tokens SET revoked = true WHERE value = $1 AND revoked = false RETURNING value',
        [token]
      )
      if (revoked.rowCount === 0) return

      await insertAuditLog(client, {
        actor: adminActor(admin),
        action: 'ADMIN_LOGOUT',
        target: {
          type: 'ADMIN_SESSION',
          id: admin.id,
          label: `${admin.username} admin session`,
        },
        changes: {
          authenticated: { before: true, after: false },
        },
      })
    })

    return sendJson(res, 200, { message: 'Logged out successfully', success: true })
  }

  if (req.method === 'GET' && parts[1] === 'me') {
    const user = await authenticatedUser(req)
    if (!user) return sendJson(res, 200, { message: 'Not logged in', success: false })
    return sendJson(res, 200, { message: `Logged in as: ${user.kit_email}`, success: true })
  }

  return sendJson(res, 404, { message: 'Not found', success: false })
}

async function handleUsers(req, res, parts) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET' && parts.length === 1) {
    const result = await query(`${USER_WITH_STATS_SELECT} ORDER BY u.role = 'ADMIN' DESC, u.joined DESC`)
    return sendJson(res, 200, { message: 'Success', success: true, users: result.rows.map(toUser) })
  }

  const userId = parts[1]
  if (!isUuid(userId)) return sendJson(res, 404, { message: 'User not found', success: false })

  if (req.method === 'GET' && parts.length === 2) {
    const user = await findUserWithStatsById(userId)
    if (!user) return sendJson(res, 404, { message: 'User not found', success: false })
    return sendJson(res, 200, user)
  }

  if (req.method === 'DELETE' && parts.length === 2) {
    const found = await withTransaction(async (client) => {
      const existing = await client.query('SELECT * FROM mock_users WHERE id = $1 FOR UPDATE', [userId])
      const targetUser = existing.rows[0]
      if (!targetUser) return false

      await client.query('DELETE FROM mock_users WHERE id = $1', [userId])
      await insertAuditLog(client, {
        actor: adminActor(admin),
        action: 'USER_DELETED',
        target: userTarget(targetUser),
        changes: {
          exists: { before: true, after: false },
        },
      })
      return true
    })
    if (!found) return sendJson(res, 404, { message: 'User not found', success: false })
    return sendJson(res, 200, { message: 'Deleted User successfully', success: true })
  }

  if (req.method === 'PATCH' && parts[2] === 'block') {
    const found = await withTransaction(async (client) => {
      const existing = await client.query('SELECT * FROM mock_users WHERE id = $1 FOR UPDATE', [userId])
      const targetUser = existing.rows[0]
      if (!targetUser) return false
      if (targetUser.status === 'BLOCKED') return true

      await client.query('UPDATE mock_users SET status = $1 WHERE id = $2', ['BLOCKED', userId])
      await insertAuditLog(client, {
        actor: adminActor(admin),
        action: 'USER_BLOCKED',
        target: userTarget(targetUser),
        changes: {
          status: { before: targetUser.status, after: 'BLOCKED' },
        },
      })
      return true
    })
    if (!found) return sendJson(res, 404, { message: 'User not found', success: false })
    return sendJson(res, 200, { message: 'Student blocked successfully', success: true })
  }

  if (req.method === 'PATCH' && parts[2] === 'unblock') {
    const found = await withTransaction(async (client) => {
      const existing = await client.query('SELECT * FROM mock_users WHERE id = $1 FOR UPDATE', [userId])
      const targetUser = existing.rows[0]
      if (!targetUser) return false
      if (targetUser.status === 'ACTIVE') return true

      await client.query('UPDATE mock_users SET status = $1 WHERE id = $2', ['ACTIVE', userId])
      await insertAuditLog(client, {
        actor: adminActor(admin),
        action: 'USER_UNBLOCKED',
        target: userTarget(targetUser),
        changes: {
          status: { before: targetUser.status, after: 'ACTIVE' },
        },
      })
      return true
    })
    if (!found) return sendJson(res, 404, { message: 'User not found', success: false })
    return sendJson(res, 200, { message: 'Student unblocked successfully', success: true })
  }

  if (parts[2] === 'warnings' && req.method === 'GET') {
    const result = await query(
      `
        SELECT w.*, a.id AS admin_id, a.username AS admin_name
        FROM mock_warnings w
        LEFT JOIN mock_users a ON a.id = w.created_from
        WHERE w.user_id = $1
        ORDER BY w.created_at DESC
      `,
      [userId]
    )
    return sendJson(res, 200, {
      message: 'Successfully found warnings for student',
      success: true,
      warnings: result.rows.map((row) => ({
        userID: row.user_id,
        message: row.message,
        createdAt: iso(row.created_at),
        createdFrom: row.admin_id ? { id: row.admin_id, student: null, createdAt: iso(row.created_at) } : null,
      })),
    })
  }

  if (parts[2] === 'warnings' && req.method === 'POST') {
    const body = await readBody(req)
    const message = String(body.message ?? '').trim()
    if (!message) return sendJson(res, 400, { message: 'Warning message is required', success: false })

    const found = await withTransaction(async (client) => {
      const existing = await client.query(
        `
          SELECT u.*, (SELECT count(*)::int FROM mock_warnings w WHERE w.user_id = u.id) AS warning_count
          FROM mock_users u
          WHERE u.id = $1
          FOR UPDATE
        `,
        [userId]
      )
      const targetUser = existing.rows[0]
      if (!targetUser) return false

      await client.query(
        `
          INSERT INTO mock_warnings (id, user_id, message, created_at, created_from)
          VALUES ($1, $2, $3, now(), $4)
        `,
        [crypto.randomUUID(), userId, message, admin.id]
      )
      await insertAuditLog(client, {
        actor: adminActor(admin),
        action: 'USER_WARNING_CREATED',
        target: userTarget(targetUser),
        changes: {
          warnings: {
            before: Number(targetUser.warning_count),
            after: Number(targetUser.warning_count) + 1,
          },
        },
        metadata: {
          reason: message,
        },
      })
      return true
    })
    if (!found) return sendJson(res, 404, { message: 'User not found', success: false })
    return sendJson(res, 200, { message: 'Student warned successfully', success: true })
  }

  return sendJson(res, 404, { message: 'Not found', success: false })
}

async function handleComments(req, res, parts) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET' && parts[1] === 'reported' && parts.length === 2) {
    const result = await query(`
      SELECT
        r.*,
        reported.id AS reported_id,
        reported.username AS reported_name,
        reported.role AS reported_role,
        reported.status AS reported_status,
        (SELECT count(*) FROM mock_warnings w WHERE w.user_id = reported.id) AS reported_warnings,
        reporter.id AS reporter_id,
        reporter.username AS reporter_name,
        reporter.role AS reporter_role,
        reporter.status AS reporter_status,
        (SELECT count(*) FROM mock_warnings w WHERE w.user_id = reporter.id) AS reporter_warnings
      FROM mock_comment_reports r
      JOIN mock_users reported ON reported.id = r.reported_user_id
      JOIN mock_users reporter ON reporter.id = r.reporter_id
      ORDER BY r.date DESC
    `)

    return sendJson(res, 200, {
      message: 'Successfully found all reported Comments',
      success: true,
      comments: result.rows.map((row) => ({
        id: row.id,
        commentContent: row.comment_content,
        postContext: row.post_context,
        reportText: row.report_text,
        reportedUser: toCommentUser(row, 'reported'),
        reporter: toCommentUser(row, 'reporter'),
        reason: row.reason,
        status: row.status,
        date: iso(row.date),
      })),
    })
  }

  if (req.method === 'PATCH' && parts[1] === 'reported' && parts[2]) {
    if (!isUuid(parts[2])) return sendJson(res, 404, { message: 'Report not found', success: false })
    const body = await readBody(req)
    const status = String(body.status ?? '')
    if (!validReportStatuses.has(status)) {
      return sendJson(res, 400, { message: 'Invalid report status', success: false })
    }

    const found = await withTransaction(async (client) => {
      const existing = await client.query(
        `
          SELECT r.*, reported.username AS reported_name
          FROM mock_comment_reports r
          JOIN mock_users reported ON reported.id = r.reported_user_id
          WHERE r.id = $1
          FOR UPDATE OF r
        `,
        [parts[2]]
      )
      const report = existing.rows[0]
      if (!report) return false
      if (report.status === status) return true

      await client.query('UPDATE mock_comment_reports SET status = $1 WHERE id = $2', [status, parts[2]])
      await insertAuditLog(client, {
        actor: adminActor(admin),
        action: 'COMMENT_REPORT_STATUS_CHANGED',
        target: {
          type: 'COMMENT_REPORT',
          id: report.id,
          label: `Report about ${report.reported_name} in ${report.post_context}`,
        },
        changes: {
          status: { before: report.status, after: status },
        },
      })
      return true
    })
    if (!found) return sendJson(res, 404, { message: 'Report not found', success: false })
    return sendJson(res, 200, { message: 'Updated', success: true })
  }

  return sendJson(res, 404, { message: 'Not found', success: false })
}

async function handleReports(req, res, parts) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET' && parts.length === 1) {
    const result = await query(`
      SELECT r.*, u.username AS reporter_name
      FROM mock_bug_reports r
      LEFT JOIN mock_users u ON u.id = r.reporter_id
      ORDER BY r.reported_at DESC
    `)
    return sendJson(res, 200, {
      message: 'Successfully found all entries',
      success: true,
      bugReports: result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        severity: row.severity,
        status: row.status,
        reporterName: row.reporter_name ?? 'Unknown',
        reportedAt: iso(row.reported_at),
      })),
    })
  }

  if (req.method === 'PATCH' && parts[1]) {
    if (!isUuid(parts[1])) return sendJson(res, 404, { message: 'Bug report not found', success: false })
    const body = await readBody(req)
    const requested = {}
    if (body.status !== undefined) {
      const status = String(body.status)
      if (!validReportStatuses.has(status)) return sendJson(res, 400, { message: 'Invalid report status', success: false })
      requested.status = status
    }
    if (body.severity !== undefined) {
      const severity = String(body.severity)
      if (!validSeverities.has(severity)) return sendJson(res, 400, { message: 'Invalid severity', success: false })
      requested.severity = severity
    }
    if (Object.keys(requested).length === 0) {
      return sendJson(res, 400, { message: 'No update supplied', success: false })
    }

    const found = await withTransaction(async (client) => {
      const existing = await client.query('SELECT * FROM mock_bug_reports WHERE id = $1 FOR UPDATE', [parts[1]])
      const report = existing.rows[0]
      if (!report) return false

      const changes = {}
      const updates = []
      const values = []
      for (const [field, nextValue] of Object.entries(requested)) {
        if (report[field] === nextValue) continue
        changes[field] = { before: report[field], after: nextValue }
        values.push(nextValue)
        updates.push(`${field} = $${values.length}`)
      }
      if (updates.length === 0) return true

      values.push(parts[1])
      await client.query(`UPDATE mock_bug_reports SET ${updates.join(', ')} WHERE id = $${values.length}`, values)
      await insertAuditLog(client, {
        actor: adminActor(admin),
        action: 'BUG_REPORT_UPDATED',
        target: {
          type: 'BUG_REPORT',
          id: report.id,
          label: report.title,
        },
        changes,
      })
      return true
    })
    if (!found) return sendJson(res, 404, { message: 'Bug report not found', success: false })
    return sendJson(res, 200, { message: 'Updated', success: true })
  }

  return sendJson(res, 404, { message: 'Not found', success: false })
}

function encodeAuditCursor(row) {
  return Buffer.from(JSON.stringify({ createdAt: iso(row.created_at), id: row.id })).toString('base64url')
}

function decodeAuditCursor(value) {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
    if (!isUuid(parsed.id) || Number.isNaN(new Date(parsed.createdAt).getTime())) return null
    return parsed
  } catch {
    return null
  }
}

function parseAuditTimestamp(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

async function handleAuditLogs(req, res, parts) {
  const admin = await requireAdmin(req, res)
  if (!admin) return
  if (req.method !== 'GET') return sendJson(res, 404, { message: 'Not found', success: false })

  if (parts[1] === 'meta' && parts.length === 2) {
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

  if (parts.length !== 1) return sendJson(res, 404, { message: 'Not found', success: false })

  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const rawLimit = url.searchParams.get('limit')
  const limit = rawLimit === null ? 50 : Number(rawLimit)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return sendJson(res, 400, { message: 'Limit must be an integer between 1 and 100', success: false })
  }

  const actorId = url.searchParams.get('actorId')
  if (actorId && !isUuid(actorId)) {
    return sendJson(res, 400, { message: 'Invalid actor id', success: false })
  }

  const action = url.searchParams.get('action')
  if (action && !validAuditActions.has(action)) {
    return sendJson(res, 400, { message: 'Invalid audit action', success: false })
  }

  const targetType = url.searchParams.get('targetType')
  if (targetType && !validAuditTargetTypes.has(targetType)) {
    return sendJson(res, 400, { message: 'Invalid audit target type', success: false })
  }

  const rawFrom = url.searchParams.get('from')
  const rawTo = url.searchParams.get('to')
  const from = parseAuditTimestamp(rawFrom)
  const to = parseAuditTimestamp(rawTo)
  if ((rawFrom && !from) || (rawTo && !to) || (from && to && from > to)) {
    return sendJson(res, 400, { message: 'Invalid audit date range', success: false })
  }

  const rawCursor = url.searchParams.get('cursor')
  const cursor = rawCursor ? decodeAuditCursor(rawCursor) : null
  if (rawCursor && !cursor) {
    return sendJson(res, 400, { message: 'Invalid audit cursor', success: false })
  }

  const clauses = []
  const values = []
  const addClause = (sql, value) => {
    values.push(value)
    clauses.push(sql.replace('?', `$${values.length}`))
  }

  if (actorId) addClause('actor_id = ?', actorId)
  if (action) addClause('action = ?', action)
  if (targetType) addClause('target_type = ?', targetType)
  if (from) addClause('created_at >= ?', from)
  if (to) addClause('created_at <= ?', to)

  const search = String(url.searchParams.get('q') ?? '').trim()
  if (search) {
    values.push(`%${search}%`)
    clauses.push(
      `(actor_name ILIKE $${values.length} OR actor_email ILIKE $${values.length} OR target_label ILIKE $${values.length})`
    )
  }

  if (cursor) {
    values.push(cursor.createdAt, cursor.id)
    clauses.push(`(created_at, id) < ($${values.length - 1}, $${values.length})`)
  }

  values.push(limit + 1)
  const result = await query(
    `
      SELECT *
      FROM mock_audit_logs
      ${clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''}
      ORDER BY created_at DESC, id DESC
      LIMIT $${values.length}
    `,
    values
  )

  const hasNextPage = result.rows.length > limit
  const rows = result.rows.slice(0, limit)
  return sendJson(res, 200, {
    message: 'Success',
    success: true,
    auditLogs: rows.map(toAuditLog),
    nextCursor: hasNextPage && rows.length > 0 ? encodeAuditCursor(rows.at(-1)) : null,
  })
}

async function route(req, res) {
  res.req = req
  if (req.method === 'OPTIONS') return sendNoContent(res)

  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
  const parts = getPathParts(url)

  try {
    if (parts.length === 0 || parts[0] === 'health') {
      return sendJson(res, 200, { message: 'Mock API healthy', success: true })
    }
    if (parts[0] === 'auth') return await handleAuth(req, res, parts)
    if (parts[0] === 'users') return await handleUsers(req, res, parts)
    if (parts[0] === 'comments') return await handleComments(req, res, parts)
    if (parts[0] === 'reports') return await handleReports(req, res, parts)
    if (parts[0] === 'audit-logs') return await handleAuditLogs(req, res, parts)
    return sendJson(res, 404, { message: 'Not found', success: false })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return sendJson(res, 400, { message: 'Invalid JSON body', success: false })
    }
    console.error(error)
    return sendJson(res, 500, { message: 'Mock API error', success: false })
  }
}

try {
  await ensureMockDatabase()
} catch (error) {
  console.error('Could not connect to the mock database. Is it running? Try `npm run db:up`.')
  console.error(error)
  await closePool()
  process.exit(1)
}

const server = http.createServer(route)

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Mock API port ${apiConfig.port} is already in use. Stop the other backend or set MOCK_API_PORT.`)
  } else {
    console.error(error)
  }
  process.exit(1)
})

server.listen(apiConfig.port, () => {
  console.log(`Mock API listening on http://localhost:${apiConfig.port}`)
  console.log(`Demo admin: u-kisi4@student.kit.edu / ${demoLoginCode}`)
})

async function shutdown() {
  server.close()
  await closePool()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
