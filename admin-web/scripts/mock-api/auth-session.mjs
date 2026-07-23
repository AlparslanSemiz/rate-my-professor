import crypto from 'node:crypto'
import { adminActor, insertAuditLog } from './audit.mjs'
import { demoAdminToken } from './config.mjs'
import { query } from './db.mjs'
import { sendJson } from './http.mjs'

const REQUIRED_ADMINS = {
  'u-kisi4@student.kit.edu': 'Alparslan',
  'u-kisi5@student.kit.edu': 'Mustafa',
  'u-kisi6@student.kit.edu': 'Luis',
  'u-kisi7@student.kit.edu': 'Yavuz',
  'u-kisi8@student.kit.edu': 'Philipp',
}

export function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

function isRequiredAdminEmail(email) {
  return Object.hasOwn(REQUIRED_ADMINS, normalizeEmail(email))
}

export async function authenticatedUser(req) {
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
    [token],
  )
  return result.rows[0] ?? null
}

export async function requireAdmin(req, res) {
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

export async function ensureUserForEmail(email, client) {
  const normalizedEmail = normalizeEmail(email)
  const existing = await client.query('SELECT * FROM mock_users WHERE kit_email = $1', [
    normalizedEmail,
  ])
  if (existing.rows[0]) return existing.rows[0]

  const username = REQUIRED_ADMINS[normalizedEmail] ?? normalizedEmail.split('@')[0]
  const role = isRequiredAdminEmail(normalizedEmail) ? 'ADMIN' : 'STUDENT'
  const result = await client.query(
    `
      INSERT INTO mock_users (id, username, kit_email, role, status, joined, last_online, biography)
      VALUES ($1, $2, $3, $4, 'ACTIVE', now(), now(), 'Created by local mock login.')
      RETURNING *
    `,
    [crypto.randomUUID(), username, normalizedEmail, role],
  )
  return result.rows[0]
}

export async function issueTokenForUser(user, client) {
  const value = user.kit_email === 'u-kisi4@student.kit.edu' ? demoAdminToken : crypto.randomUUID()
  await client.query(
    `
      INSERT INTO mock_tokens (value, user_id, expires_at, revoked)
      VALUES ($1, $2, now() + interval '365 days', false)
      ON CONFLICT (value)
      DO UPDATE SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at, revoked = false
    `,
    [value, user.id],
  )
  return value
}

export async function revokeAdminToken(token, admin, client) {
  const revoked = await client.query(
    'UPDATE mock_tokens SET revoked = true WHERE value = $1 AND revoked = false RETURNING value',
    [token],
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
}
