import { requireAdmin } from '../auth-session.mjs'
import { query } from '../db.mjs'
import { isUuid, sendJson } from '../http.mjs'
import { toManagedAnswer, toReportedAnswer } from '../mappers.mjs'
import { deleteContent, updateContent } from './content.mjs'
import { deleteReport, updateReportStatus } from './reports-shared.mjs'

const LECTURE_LABEL = "l.code || ' — ' || l.name"
const PREVIEW_LENGTH = 120

export async function handleAnswers(req, res, parts) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method === 'GET' && parts.length === 1) {
    return listAnswers(res)
  }
  if (req.method === 'GET' && parts[1] === 'reported' && parts.length === 2) {
    return listReportedAnswers(res)
  }

  if (parts[1] === 'reported' && parts[2]) {
    if (!isUuid(parts[2])) {
      return sendJson(res, 404, { message: 'Report not found', success: false })
    }
    if (req.method === 'PATCH') {
      return updateReportStatus(req, res, {
        id: parts[2],
        table: 'mock_answer_reports',
        contentTable: 'mock_answers',
        contentColumn: 'answer_id',
        action: 'ANSWER_REPORT_STATUS_CHANGED',
        targetType: 'ANSWER_REPORT',
        label: (report) => `Report in ${report.post_context}`,
        admin,
        notFound: 'Report not found',
      })
    }
    if (req.method === 'DELETE') {
      return deleteReport(res, {
        id: parts[2],
        table: 'mock_answer_reports',
        action: 'ANSWER_REPORT_DELETED',
        targetType: 'ANSWER_REPORT',
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
        table: 'mock_answers',
        action: 'ANSWER_UPDATED',
        targetType: 'ANSWER',
        label: answerLabel,
        admin,
        notFound: 'Answer not found',
      })
    }
    if (req.method === 'DELETE') {
      return deleteContent(res, {
        id: parts[1],
        table: 'mock_answers',
        action: 'ANSWER_DELETED',
        targetType: 'ANSWER',
        label: answerLabel,
        admin,
        notFound: 'Answer not found',
      })
    }
  }

  return sendJson(res, 404, { message: 'Not found', success: false })
}

async function answerLabel(client, answer) {
  const result = await client.query(
    `
      SELECT u.username, ${LECTURE_LABEL} AS context
      FROM mock_answers a
      JOIN mock_users u ON u.id = a.student_id
      JOIN mock_comments c ON c.id = a.comment_id
      JOIN mock_lectures l ON l.id = c.lecture_id
      WHERE a.id = $1
    `,
    [answer.id],
  )
  const row = result.rows[0]
  return row ? `Answer by ${row.username} in ${row.context}` : 'Answer'
}

async function listAnswers(res) {
  const result = await query(`
    SELECT
      a.*,
      ${LECTURE_LABEL} AS post_context,
      left(c.content, ${PREVIEW_LENGTH}) AS comment_preview,
      author.id AS author_id,
      author.username AS author_name,
      author.role AS author_role,
      author.status AS author_status,
      (SELECT count(*) FROM mock_warnings w WHERE w.user_id = author.id) AS author_warnings,
      (SELECT count(*) FROM mock_answer_reports r WHERE r.answer_id = a.id) AS report_count
    FROM mock_answers a
    JOIN mock_users author ON author.id = a.student_id
    JOIN mock_comments c ON c.id = a.comment_id
    JOIN mock_lectures l ON l.id = c.lecture_id
    ORDER BY a.created_at DESC
  `)

  return sendJson(res, 200, {
    message: 'Successfully found all answers',
    success: true,
    answers: result.rows.map(toManagedAnswer),
  })
}

async function listReportedAnswers(res) {
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
    FROM mock_answer_reports r
    JOIN mock_users reported ON reported.id = r.reported_user_id
    JOIN mock_users reporter ON reporter.id = r.reporter_id
    ORDER BY r.date DESC
  `)

  return sendJson(res, 200, {
    message: 'Successfully found all reported answers',
    success: true,
    answers: result.rows.map(toReportedAnswer),
  })
}
