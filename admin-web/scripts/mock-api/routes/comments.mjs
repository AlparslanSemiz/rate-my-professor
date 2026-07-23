import { adminActor, insertAuditLog } from '../audit.mjs'
import { requireAdmin } from '../auth-session.mjs'
import { query, withTransaction } from '../db.mjs'
import { iso, isUuid, readBody, sendJson } from '../http.mjs'
import { toCommentUser } from '../mappers.mjs'

const VALID_REPORT_STATUSES = new Set(['OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'])

export async function handleComments(req, res, parts) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET' && parts[1] === 'reported' && parts.length === 2) {
    return listReportedComments(res)
  }
  if (req.method === 'PATCH' && parts[1] === 'reported' && parts[2]) {
    return updateReportedComment(req, res, parts[2], admin)
  }
  return sendJson(res, 404, { message: 'Not found', success: false })
}

async function listReportedComments(res) {
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

async function updateReportedComment(req, res, reportId, admin) {
  if (!isUuid(reportId)) {
    return sendJson(res, 404, { message: 'Report not found', success: false })
  }

  const body = await readBody(req)
  const status = String(body.status ?? '')
  if (!VALID_REPORT_STATUSES.has(status)) {
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
      [reportId],
    )
    const report = existing.rows[0]
    if (!report) return false
    if (report.status === status) return true

    await client.query('UPDATE mock_comment_reports SET status = $1 WHERE id = $2', [
      status,
      reportId,
    ])
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

  if (!found) {
    return sendJson(res, 404, { message: 'Report not found', success: false })
  }
  return sendJson(res, 200, { message: 'Updated', success: true })
}
