import { adminActor, insertAuditLog, userTarget } from '../audit.mjs'
import { withTransaction } from '../db.mjs'
import { sendJson } from '../http.mjs'

export const USER_STATUS_CHANGES = {
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

export async function deleteUser(res, userId, admin) {
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

export async function changeUserStatus(res, userId, admin, change) {
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
