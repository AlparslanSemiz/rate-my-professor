import { getPathParts, sendJson, sendNoContent } from './http.mjs'
import { handleActivityLogs } from './routes/activity-logs.mjs'
import { handleAuditLogs } from './routes/audit-logs.mjs'
import { handleAuth } from './routes/auth.mjs'
import { handleComments } from './routes/comments.mjs'
import { handleReports } from './routes/reports.mjs'
import { handleSystemStatus } from './routes/system-status.mjs'
import { handleUsers } from './routes/users.mjs'

export async function route(req, res) {
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
    if (parts[0] === 'activity-logs') return await handleActivityLogs(req, res, parts)
    if (parts[0] === 'system') return await handleSystemStatus(req, res, parts)
    return sendJson(res, 404, { message: 'Not found', success: false })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return sendJson(res, 400, { message: 'Invalid JSON body', success: false })
    }
    console.error(error)
    return sendJson(res, 500, { message: 'Mock API error', success: false })
  }
}
