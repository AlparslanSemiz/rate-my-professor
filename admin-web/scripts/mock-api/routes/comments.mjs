import { requireAdmin } from '../auth-session.mjs'
import { query } from '../db.mjs'
import { isUuid, sendJson } from '../http.mjs'
import { toManagedComment, toReportedComment } from '../mappers.mjs'
import { deleteContent, updateContent } from './content.mjs'
import { deleteReport, updateReportStatus } from './reports-shared.mjs'

const LECTURE_LABEL = "l.code || ' — ' || l.name"

export async function handleComments(req, res, parts) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET' && parts.length === 1) {
    return listComments(res)
  }
  if (req.method === 'GET' && parts[1] === 'reported' && parts.length === 2) {
    return listReportedComments(res)
  }

  if (parts[1] === 'reported' && parts[2]) {
    if (!isUuid(parts[2])) {
      return sendJson(res, 404, { message: 'Report not found', success: false })
    }
    if (req.method === 'PATCH') {
      return updateReportStatus(req, res, {
        id: parts[2],
        table: 'mock_comment_reports',
        contentTable: 'mock_comments',
        contentColumn: 'comment_id',
        action: 'COMMENT_REPORT_STATUS_CHANGED',
        targetType: 'COMMENT_REPORT',
        label: (report) => `Report in ${report.post_context}`,
        admin,
        notFound: 'Report not found',
      })
    }
    if (req.method === 'DELETE') {
      return deleteReport(res, {
        id: parts[2],
        table: 'mock_comment_reports',
        action: 'COMMENT_REPORT_DELETED',
        targetType: 'COMMENT_REPORT',
        label: (report) => `Report in ${report.post_context}`,
        admin,
        notFound: 'Report not found',
      })
    }
  }

  if (parts.length === 2 && isUuid(parts[1])) {
    if (req.method === 'PATCH') {
      return updateContent(req, res, {
        id: parts[1],
        table: 'mock_comments',
        action: 'COMMENT_UPDATED',
        targetType: 'COMMENT',
        label: commentLabel,
        admin,
        notFound: 'Comment not found',
      })
    }
    if (req.method === 'DELETE') {
      return deleteContent(res, {
        id: parts[1],
        table: 'mock_comments',
        action: 'COMMENT_DELETED',
        targetType: 'COMMENT',
        label: commentLabel,
        admin,
        notFound: 'Comment not found',
        metadata: countAnswers,
      })
    }
  }

  return sendJson(res, 404, { message: 'Not found', success: false })
}

async function commentLabel(client, comment) {
  const result = await client.query(
    `
      SELECT u.username, ${LECTURE_LABEL} AS context
      FROM mock_comments c
      JOIN mock_users u ON u.id = c.student_id
      JOIN mock_lectures l ON l.id = c.lecture_id
      WHERE c.id = $1
    `,
    [comment.id],
  )
  const row = result.rows[0]
  return row ? `Comment by ${row.username} in ${row.context}` : 'Comment'
}

async function countAnswers(client, comment) {
  const result = await client.query(
    'SELECT count(*)::int AS count FROM mock_answers WHERE comment_id = $1',
    [comment.id],
  )
  return { deletedAnswers: result.rows[0].count }
}

async function listComments(res) {
  const result = await query(`
    SELECT
      c.*,
      ${LECTURE_LABEL} AS post_context,
      author.id AS author_id,
      author.username AS author_name,
      author.role AS author_role,
      author.status AS author_status,
      (SELECT count(*) FROM mock_warnings w WHERE w.user_id = author.id) AS author_warnings,
      (SELECT count(*) FROM mock_answers a WHERE a.comment_id = c.id) AS answer_count,
      (SELECT count(*) FROM mock_comment_reports r WHERE r.comment_id = c.id) AS report_count
    FROM mock_comments c
    JOIN mock_users author ON author.id = c.student_id
    JOIN mock_lectures l ON l.id = c.lecture_id
    ORDER BY c.created_at DESC
  `)

  return sendJson(res, 200, {
    message: 'Successfully found all comments',
    success: true,
    comments: result.rows.map(toManagedComment),
  })
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
    message: 'Successfully found all reported comments',
    success: true,
    comments: result.rows.map(toReportedComment),
  })
}
