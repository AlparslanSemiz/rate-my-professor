import crypto from 'node:crypto'
import { adminActor, insertAuditLog, userTarget } from '../audit.mjs'
import { withTransaction } from '../db.mjs'
import { readBody, sendJson } from '../http.mjs'

async function findUserForWarning(client, userId) {
  const existing = await client.query(
    `
      SELECT u.*, (SELECT count(*)::int FROM mock_warnings w WHERE w.user_id = u.id) AS warning_count
      FROM mock_users u
      WHERE u.id = $1
      FOR UPDATE
    `,
    [userId],
  )
  return existing.rows[0] ?? null
}

async function insertWarning(client, userId, adminId, message) {
  await client.query(
    `
      INSERT INTO mock_warnings (id, user_id, message, created_at, created_from)
      VALUES ($1, $2, $3, now(), $4)
    `,
    [crypto.randomUUID(), userId, message, adminId],
  )
}

async function createWarningWithAudit(client, userId, admin, message) {
  const targetUser = await findUserForWarning(client, userId)
  if (!targetUser) return false

  await insertWarning(client, userId, admin.id, message)
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
    metadata: { reason: message },
  })
  return true
}

export async function createWarning(req, res, userId, admin) {
  const body = await readBody(req)
  const message = String(body.message ?? '').trim()
  if (!message) {
    return sendJson(res, 400, { message: 'Warning message is required', success: false })
  }

  const found = await withTransaction((client) =>
    createWarningWithAudit(client, userId, admin, message),
  )

  if (!found) {
    return sendJson(res, 404, { message: 'User not found', success: false })
  }
  return sendJson(res, 200, { message: 'Student warned successfully', success: true })
}
