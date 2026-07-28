import { AUDIT_ACTIONS } from '../audit.mjs'
import { requireAdmin } from '../auth-session.mjs'
import { query } from '../db.mjs'
import { iso, sendJson } from '../http.mjs'

/** Above this round-trip time the local API calls itself degraded rather than healthy. */
const DEGRADED_LATENCY_MS = 250
const MOCK_API_VERSION = 'mock-api'

export async function handleSystemStatus(req, res, parts) {
  const admin = await requireAdmin(req, res)
  if (!admin) return
  if (req.method !== 'GET' || parts[1] !== 'status' || parts.length !== 2) {
    return sendJson(res, 404, { message: 'Not found', success: false })
  }
  return getSystemStatus(res)
}

async function getSystemStatus(res) {
  const database = await measureDatabase()
  const healthy = database.status === 'UP'

  return sendJson(res, 200, {
    message: 'Success',
    success: true,
    status: systemHealth(database),
    checkedAt: new Date().toISOString(),
    version: MOCK_API_VERSION,
    uptimeSeconds: Math.round(process.uptime()),
    database,
    counts: healthy ? await readCounts() : {},
    lastWriteAt: healthy ? await readLastWrites() : {},
  })
}

function systemHealth(database) {
  if (database.status !== 'UP') return 'DOWN'
  return database.latencyMs > DEGRADED_LATENCY_MS ? 'DEGRADED' : 'OK'
}

async function measureDatabase() {
  const startedAt = Date.now()
  try {
    await query('SELECT 1')
    return { status: 'UP', latencyMs: Date.now() - startedAt, pendingMigrations: 0 }
  } catch (error) {
    console.error('System status database probe failed', error)
    return { status: 'DOWN', latencyMs: null, pendingMigrations: null }
  }
}

/**
 * Live record counts. These are what an admin watches to confirm an action reached the
 * database: block someone, refresh, `blockedUsers` goes up.
 */
async function readCounts() {
  const result = await query(`
    SELECT
      (SELECT count(*) FROM mock_users) AS "users",
      (SELECT count(*) FROM mock_users WHERE status = 'ACTIVE') AS "activeUsers",
      (SELECT count(*) FROM mock_users WHERE status = 'BLOCKED') AS "blockedUsers",
      (SELECT count(*) FROM mock_warnings) AS "warnings",
      (SELECT count(*) FROM mock_comment_reports WHERE status = 'OPEN') AS "openCommentReports",
      (SELECT count(*) FROM mock_bug_reports WHERE status = 'OPEN') AS "openBugReports",
      (SELECT count(*) FROM mock_audit_logs) AS "auditLogs",
      (SELECT count(*) FROM mock_activity_logs) AS "activityLogs"
  `)
  return Object.fromEntries(
    Object.entries(result.rows[0]).map(([key, value]) => [key, Number(value)]),
  )
}

/** When each administrative action last actually wrote something, or null if it never has. */
async function readLastWrites() {
  const result = await query(`
    SELECT action, max(created_at) AS last_write
    FROM mock_audit_logs
    GROUP BY action
  `)

  const lastWriteAt = Object.fromEntries(AUDIT_ACTIONS.map((action) => [action, null]))
  for (const row of result.rows) {
    lastWriteAt[row.action] = iso(row.last_write)
  }
  return lastWriteAt
}
