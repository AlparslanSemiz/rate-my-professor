import { adminActor, insertAuditLog } from '../audit.mjs'
import { withTransaction } from '../db.mjs'
import { readBody, sendJson } from '../http.mjs'

export const VALID_REPORT_STATUSES = new Set(['OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'])

/**
 * Moves a content report to a new status. `ACTION_TAKEN` is the only status that means the
 * content was moderated, so it is the only one that hides it; any other status puts it back.
 */
export async function updateReportStatus(req, res, {
  id,
  table,
  contentTable,
  contentColumn,
  action,
  targetType,
  label,
  admin,
  notFound,
}) {
  const body = await readBody(req)
  const status = String(body.status ?? '')
  if (!VALID_REPORT_STATUSES.has(status)) {
    return sendJson(res, 400, { message: 'Invalid report status', success: false })
  }

  const found = await withTransaction(async (client) => {
    const existing = await client.query(`SELECT * FROM ${table} WHERE id = $1 FOR UPDATE`, [id])
    const report = existing.rows[0]
    if (!report) return false
    if (report.status === status) return true

    const changes = { status: { before: report.status, after: status } }
    await client.query(`UPDATE ${table} SET status = $1 WHERE id = $2`, [status, id])

    const contentId = report[contentColumn]
    if (contentId) {
      const nextStatus = status === 'ACTION_TAKEN' ? 'HIDDEN' : 'VISIBLE'
      const content = await client.query(
        `SELECT status FROM ${contentTable} WHERE id = $1 FOR UPDATE`,
        [contentId],
      )
      const before = content.rows[0]?.status
      if (before && before !== nextStatus) {
        await client.query(`UPDATE ${contentTable} SET status = $1 WHERE id = $2`, [
          nextStatus,
          contentId,
        ])
        changes[`${targetType === 'COMMENT_REPORT' ? 'comment' : 'answer'}Status`] = {
          before,
          after: nextStatus,
        }
      }
    }

    await insertAuditLog(client, {
      actor: adminActor(admin),
      action,
      target: { type: targetType, id, label: label(report) },
      changes,
    })
    return true
  })

  if (!found) return sendJson(res, 404, { message: notFound, success: false })
  return sendJson(res, 200, { message: 'Updated', success: true })
}

/** Withdraws a report. The reported content is left exactly as it is. */
export async function deleteReport(res, { id, table, action, targetType, label, admin, notFound }) {
  const found = await withTransaction(async (client) => {
    const existing = await client.query(`SELECT * FROM ${table} WHERE id = $1 FOR UPDATE`, [id])
    const report = existing.rows[0]
    if (!report) return false

    await client.query(`DELETE FROM ${table} WHERE id = $1`, [id])
    await insertAuditLog(client, {
      actor: adminActor(admin),
      action,
      target: { type: targetType, id, label: label(report) },
      changes: { exists: { before: true, after: false } },
      metadata: { status: report.status },
    })
    return true
  })

  if (!found) return sendJson(res, 404, { message: notFound, success: false })
  return sendJson(res, 200, { message: 'Deleted report successfully', success: true })
}
