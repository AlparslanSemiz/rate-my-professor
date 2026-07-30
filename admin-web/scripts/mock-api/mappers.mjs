import { query } from './db.mjs'
import { iso } from './http.mjs'

export const USER_WITH_STATS_SELECT = `
  SELECT
    u.*,
    (SELECT count(*) FROM mock_warnings w WHERE w.user_id = u.id) AS warnings,
    (SELECT count(*) FROM mock_comment_reports r WHERE r.reported_user_id = u.id) AS reports
  FROM mock_users u
`

export function toUser(row) {
  return {
    id: row.id,
    username: row.username,
    kitEmail: row.kit_email,
    role: row.role,
    status: row.status,
    joined: iso(row.joined),
    lastOnline: iso(row.last_online),
    biography: row.biography ?? '',
    warnings: Number(row.warnings ?? 0),
    reports: Number(row.reports ?? 0),
  }
}

export function toCommentUser(row, prefix) {
  return {
    id: row[`${prefix}_id`],
    name: row[`${prefix}_name`],
    role: row[`${prefix}_role`],
    warnings: Number(row[`${prefix}_warnings`] ?? 0),
    status: row[`${prefix}_status`],
  }
}

export function toReportedComment(row) {
  return {
    id: row.id,
    commentContent: row.comment_content,
    postContext: row.post_context,
    reportText: row.report_text,
    reportedUser: toCommentUser(row, 'reported'),
    reporter: toCommentUser(row, 'reporter'),
    reason: row.reason,
    status: row.status,
    date: iso(row.date),
  }
}

export function toBugReport(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    reporterName: row.reporter_name ?? 'Unknown',
    reportedAt: iso(row.reported_at),
  }
}

export function toAuditLog(row) {
  return {
    id: row.id,
    action: row.action,
    createdAt: iso(row.created_at),
    actor: {
      type: row.actor_type,
      id: row.actor_id,
      name: row.actor_name,
      email: row.actor_email,
      role: row.actor_role,
    },
    target: row.target_type
      ? {
          type: row.target_type,
          id: row.target_id,
          label: row.target_label,
        }
      : null,
    changes: row.changes ?? {},
    metadata: row.metadata ?? {},
  }
}

export async function findUserWithStatsById(id) {
  const result = await query(`${USER_WITH_STATS_SELECT} WHERE u.id = $1`, [id])
  return result.rows[0] ? toUser(result.rows[0]) : null
}

export function toManagedComment(row) {
  return {
    id: row.id,
    content: row.content,
    status: row.status,
    author: toCommentUser(row, 'author'),
    postContext: row.post_context,
    lectureId: row.lecture_id,
    answers: Number(row.answer_count ?? 0),
    reports: Number(row.report_count ?? 0),
    createdAt: iso(row.created_at),
  }
}

export function toManagedAnswer(row) {
  return {
    id: row.id,
    content: row.content,
    status: row.status,
    author: toCommentUser(row, 'author'),
    commentId: row.comment_id,
    commentPreview: row.comment_preview ?? '',
    postContext: row.post_context,
    reports: Number(row.report_count ?? 0),
    createdAt: iso(row.created_at),
  }
}

export function toReportedAnswer(row) {
  return {
    id: row.id,
    answerContent: row.answer_content,
    commentContent: row.comment_content,
    postContext: row.post_context,
    reportText: row.report_text,
    reportedUser: toCommentUser(row, 'reported'),
    reporter: toCommentUser(row, 'reporter'),
    reason: row.reason,
    status: row.status,
    date: iso(row.date),
  }
}

export function toLecture(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    semesterYear: Number(row.semester_year),
    semesterSeason: row.semester_season,
    active: row.active,
    professors: row.professors ?? [],
    commentCount: Number(row.comment_count ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
  }
}

export function toProfessor(row) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    averageRating: row.average_rating === null ? null : Number(row.average_rating),
    ratingCount: Number(row.rating_count ?? 0),
  }
}
