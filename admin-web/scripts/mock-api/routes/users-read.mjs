import { query } from '../db.mjs'
import { iso, sendJson } from '../http.mjs'
import { findUserWithStatsById, toUser, USER_WITH_STATS_SELECT } from '../mappers.mjs'

export async function listUsers(res) {
  const result = await query(
    `${USER_WITH_STATS_SELECT} ORDER BY u.role = 'ADMIN' DESC, u.joined DESC`,
  )
  return sendJson(res, 200, {
    message: 'Success',
    success: true,
    users: result.rows.map(toUser),
  })
}

export async function getUser(res, userId) {
  const user = await findUserWithStatsById(userId)
  if (!user) {
    return sendJson(res, 404, { message: 'User not found', success: false })
  }
  return sendJson(res, 200, user)
}

export async function getWarnings(res, userId) {
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
