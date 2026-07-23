import { adminActor, insertAuditLog } from '../audit.mjs'
import { requireAdmin } from '../auth-session.mjs'
import { query, withTransaction } from '../db.mjs'
import { isUuid, readBody, sendJson } from '../http.mjs'
import { toBugReport } from '../mappers.mjs'

const VALID_REPORT_STATUSES = new Set(['OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'])
const VALID_SEVERITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

export async function handleReports(req, res, parts) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET' && parts.length === 1) {
    return listReports(res)
  }
  if (req.method === 'PATCH' && parts[1]) {
    return updateReport(req, res, parts[1], admin)
  }
  return sendJson(res, 404, { message: 'Not found', success: false })
}

async function listReports(res) {
  const result = await query(`
    SELECT r.*, u.username AS reporter_name
    FROM mock_bug_reports r
    LEFT JOIN mock_users u ON u.id = r.reporter_id
    ORDER BY r.reported_at DESC
  `)
  return sendJson(res, 200, {
    message: 'Successfully found all entries',
    success: true,
    bugReports: result.rows.map(toBugReport),
  })
}

function parseRequestedUpdate(body) {
  const requested = {}

  if (body.status !== undefined) {
    const status = String(body.status)
    if (!VALID_REPORT_STATUSES.has(status)) {
      return { error: 'Invalid report status' }
    }
    requested.status = status
  }
  if (body.severity !== undefined) {
    const severity = String(body.severity)
    if (!VALID_SEVERITIES.has(severity)) {
      return { error: 'Invalid severity' }
    }
    requested.severity = severity
  }
  if (Object.keys(requested).length === 0) {
    return { error: 'No update supplied' }
  }
  return { requested }
}

async function updateReport(req, res, reportId, admin) {
  if (!isUuid(reportId)) {
    return sendJson(res, 404, { message: 'Bug report not found', success: false })
  }

  const parsed = parseRequestedUpdate(await readBody(req))
  if (parsed.error) {
    return sendJson(res, 400, { message: parsed.error, success: false })
  }

  const found = await withTransaction((client) =>
    applyReportUpdate(client, reportId, parsed.requested, admin),
  )
  if (!found) {
    return sendJson(res, 404, { message: 'Bug report not found', success: false })
  }
  return sendJson(res, 200, { message: 'Updated', success: true })
}

function buildReportUpdate(report, requested) {
  const changes = {}
  const assignments = []
  const values = []

  for (const [field, nextValue] of Object.entries(requested)) {
    if (report[field] === nextValue) continue
    changes[field] = { before: report[field], after: nextValue }
    values.push(nextValue)
    assignments.push(`${field} = $${values.length}`)
  }
  return { assignments, changes, values }
}

async function applyReportUpdate(client, reportId, requested, admin) {
  const existing = await client.query('SELECT * FROM mock_bug_reports WHERE id = $1 FOR UPDATE', [
    reportId,
  ])
  const report = existing.rows[0]
  if (!report) return false

  const update = buildReportUpdate(report, requested)
  if (update.assignments.length === 0) return true

  update.values.push(reportId)
  await client.query(
    `UPDATE mock_bug_reports SET ${update.assignments.join(', ')} WHERE id = $${update.values.length}`,
    update.values,
  )
  await insertAuditLog(client, {
    actor: adminActor(admin),
    action: 'BUG_REPORT_UPDATED',
    target: {
      type: 'BUG_REPORT',
      id: report.id,
      label: report.title,
    },
    changes: update.changes,
  })
  return true
}
