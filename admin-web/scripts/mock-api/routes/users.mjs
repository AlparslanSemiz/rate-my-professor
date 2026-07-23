import { requireAdmin } from '../auth-session.mjs'
import { isUuid, sendJson } from '../http.mjs'
import {
  changeUserStatus,
  deleteUser,
  USER_STATUS_CHANGES,
} from './users-lifecycle.mjs'
import { getUser, getWarnings, listUsers } from './users-read.mjs'
import { createWarning } from './users-warnings.mjs'

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

  const statusChange = req.method === 'PATCH' ? USER_STATUS_CHANGES[parts[2]] : null
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
