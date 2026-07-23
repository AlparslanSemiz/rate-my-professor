import crypto from 'node:crypto'
import { adminActor, insertAuditLog, userTarget } from '../audit.mjs'
import { requireAdmin } from '../auth-session.mjs'
import { query, withTransaction } from '../db.mjs'
import { iso, isUuid, readBody, sendJson } from '../http.mjs'
import { findUserWithStatsById, toUser, USER_WITH_STATS_SELECT } from '../mappers.mjs'

const STATUS_CHANGES = {
  block: {
    status: 'BLOCKED',
    action: 'USER_BLOCKED',
    message: 'Student blocked successfully',
  },
  unblock: {
    status: 'ACTIVE',
    action: 'USER_UNBLOCKED',
    message: 'Student unblocked successfully',
  },
}

export async function handleUsers(req, res, parts) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET' && parts.length === 1) {
    return listUsers(res)
  }

  const userId = parts[1]
  if (!isUuid(userId)) {
    return sendJson(res, 404, { message: 'User not found', success: false })
  }

  if (req.method === 'GET' && parts.length === 2) {
    return getUser(res, userId)
  }
  if (req.method === 'DELETE' && parts.length === 2) {
    return deleteUser(res, userId, admin)
  }

  const statusChange = req.method === 'PATCH' ? STATUS_CHANGES[parts[2]] : null
  if (statusChange) {
    return changeUserStatus(res, userId, admin, statusChange)
  }
  if (parts[2] === 'warnings' && req.method === 'GET') {
    return getWarnings(res, userId)
  }
  if (parts[2] === 'warnings' && req.method === 'POST') {
    return createWarning(req, res, userId, admin)
  }

  return sendJson(res, 404, { message: 'Not found', success: false })
}

async function listUsers(res) {
  const result = await query(
    `${USER_WITH_STATS_SELECT} ORDER BY u.role = 'ADMIN' DESC, u.joined DESC`,
  )
  return sendJson(res, 200, {
    message: 'Success',
    success: true,
    users: result.rows.map(toUser),
  })
}

async function getUser(res, userId) {
  const user = await findUserWithStatsById(userId)
  if (!user) {
    return sendJson(res, 404, { message: 'User not found', success: false })
  }
  return sendJson(res, 200, user)
}

async function deleteUser(res, userId, admin) {
  const found = await withTransaction(async (client) => {
    const existing = await client.query('SELECT * FROM mock_users WHERE id = $1 FOR UPDATE', [
      userId,
    ])
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

  if (!found) {
    return sendJson(res, 404, { message: 'User not found', success: false })
  }
  return sendJson(res, 200, { message: 'Deleted User successfully', success: true })
}

async function changeUserStatus(res, userId, admin, change) {
  const found = await withTransaction(async (client) => {
    const existing = await client.query('SELECT * FROM mock_users WHERE id = $1 FOR UPDATE', [
      userId,
    ])
    const targetUser = existing.rows[0]
    if (!targetUser) return false
    if (targetUser.status === change.status) return true

    await client.query('UPDATE mock_users SET status = $1 WHERE id = $2', [
      change.status,
      userId,
    ])
    await insertAuditLog(client, {
      actor: adminActor(admin),
      action: change.action,
      target: userTarget(targetUser),
      changes: {
        status: { before: targetUser.status, after: change.status },
      },
    })
    return true
  })

  if (!found) {
    return sendJson(res, 404, { message: 'User not found', success: false })
  }
  return sendJson(res, 200, { message: change.message, success: true })
}

async function getWarnings(res, userId) {
  const result = await query(
    `
      SELECT w.*, a.id AS admin_id, a.username AS admin_name
      FROM mock_warnings w
      LEFT JOIN mock_users a ON a.id = w.created_from
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `,
    [userId],
  )
  return sendJson(res, 200, {
    message: 'Successfully found warnings for student',
    success: true,
    warnings: result.rows.map((row) => ({
      userID: row.user_id,
      message: row.message,
      createdAt: iso(row.created_at),
      createdFrom: row.admin_id
        ? { id: row.admin_id, student: null, createdAt: iso(row.created_at) }
        : null,
    })),
  })
}

async function createWarning(req, res, userId, admin) {
  const body = await readBody(req)
  const message = String(body.message ?? '').trim()
  if (!message) {
    return sendJson(res, 400, { message: 'Warning message is required', success: false })
  }

  const found = await withTransaction(async (client) => {
    const existing = await client.query(
      `
        SELECT u.*, (SELECT count(*)::int FROM mock_warnings w WHERE w.user_id = u.id) AS warning_count
        FROM mock_users u
        WHERE u.id = $1
        FOR UPDATE
      `,
      [userId],
    )
    const targetUser = existing.rows[0]
    if (!targetUser) return false

    await client.query(
      `
        INSERT INTO mock_warnings (id, user_id, message, created_at, created_from)
        VALUES ($1, $2, $3, now(), $4)
      `,
      [crypto.randomUUID(), userId, message, admin.id],
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
      metadata: { reason: message },
    })
    return true
  })

  if (!found) {
    return sendJson(res, 404, { message: 'User not found', success: false })
  }
  return sendJson(res, 200, { message: 'Student warned successfully', success: true })
}
