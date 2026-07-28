import { insertActivityLog } from './activity.mjs'
import { insertAuditLog } from './audit.mjs'
import { demoAdminToken, demoLoginCode } from './config.mjs'
import {
  activityLogs,
  auditLogs,
  bugReports,
  commentReports,
  users,
  warnings,
} from './fixtures.mjs'

async function seedUsers(client) {
  for (const user of users) {
    await client.query(
      `
        INSERT INTO mock_users (id, username, kit_email, role, status, joined, last_online, biography)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        user.id,
        user.username,
        user.kitEmail,
        user.role,
        user.status,
        user.joined,
        user.lastOnline,
        user.biography,
      ],
    )
  }
}

async function seedTokens(client) {
  const adminId = users[0].id
  const tokens = [demoAdminToken, 'mock-token-1', 'stored-token', 'admin-token', 'test-token']
  for (const value of tokens) {
    await client.query(
      "INSERT INTO mock_tokens (value, user_id, expires_at, revoked) VALUES ($1, $2, now() + interval '365 days', false)",
      [value, adminId],
    )
  }
  await client.query(
    "INSERT INTO mock_login_codes (email, code, expires_at) VALUES ($1, $2, now() + interval '1 day')",
    [users[0].kitEmail, demoLoginCode],
  )
}

async function seedWarnings(client) {
  for (const warning of warnings) {
    await client.query(
      `
        INSERT INTO mock_warnings (id, user_id, message, created_at, created_from)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [warning.id, warning.userId, warning.message, warning.createdAt, warning.createdFrom],
    )
  }
}

async function seedCommentReports(client) {
  for (const report of commentReports) {
    await client.query(
      `
        INSERT INTO mock_comment_reports (
          id, comment_content, post_context, report_text, reported_user_id, reporter_id, reason, status, date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        report.id,
        report.commentContent,
        report.postContext,
        report.reportText,
        report.reportedUserId,
        report.reporterId,
        report.reason,
        report.status,
        report.date,
      ],
    )
  }
}

async function seedBugReports(client) {
  for (const report of bugReports) {
    await client.query(
      `
        INSERT INTO mock_bug_reports (id, title, description, severity, status, reporter_id, reported_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        report.id,
        report.title,
        report.description,
        report.severity,
        report.status,
        report.reporterId,
        report.reportedAt,
      ],
    )
  }
}

async function seedAuditLogs(client) {
  const actor = {
    type: 'ADMIN',
    id: users[0].id,
    name: users[0].username,
    email: users[0].kitEmail,
    role: users[0].role,
  }
  for (const auditLog of auditLogs) {
    await insertAuditLog(client, { ...auditLog, actor })
  }
}

function fixtureActor(actorId) {
  const user = users.find((candidate) => candidate.id === actorId)
  if (!user) return null
  return {
    type: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
    id: user.id,
    name: user.username,
    email: user.kitEmail,
    role: user.role,
  }
}

async function seedActivityLogs(client) {
  for (const { actorId, ...activity } of activityLogs) {
    await insertActivityLog(client, { ...activity, actor: fixtureActor(actorId) })
  }
}

export async function seedAll(client) {
  await seedUsers(client)
  await seedTokens(client)
  await seedWarnings(client)
  await seedCommentReports(client)
  await seedBugReports(client)
  await seedAuditLogs(client)
  await seedActivityLogs(client)
}
