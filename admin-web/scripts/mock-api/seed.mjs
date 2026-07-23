import { closePool, withTransaction } from './db.mjs'
import { demoAdminToken, demoLoginCode } from './config.mjs'
import { fileURLToPath } from 'node:url'
import { insertAuditLog } from './audit.mjs'

const users = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'Alparslan',
    kitEmail: 'u-kisi4@student.kit.edu',
    role: 'ADMIN',
    status: 'ACTIVE',
    joined: '2026-06-20T09:00:00.000Z',
    lastOnline: '2026-07-14T15:25:00.000Z',
    biography: 'Demo admin account for local moderation.',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    username: 'MiraK',
    kitEmail: 'mira@student.kit.edu',
    role: 'STUDENT',
    status: 'ACTIVE',
    joined: '2026-06-24T10:30:00.000Z',
    lastOnline: '2026-07-14T13:45:00.000Z',
    biography: 'Computer science student. Usually helpful in lecture threads.',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    username: 'JonasB',
    kitEmail: 'jonas@student.kit.edu',
    role: 'STUDENT',
    status: 'BLOCKED',
    joined: '2026-06-28T12:15:00.000Z',
    lastOnline: '2026-07-12T08:20:00.000Z',
    biography: 'Account currently blocked after repeated reports.',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    username: 'LeylaS',
    kitEmail: 'leyla@student.kit.edu',
    role: 'STUDENT',
    status: 'ACTIVE',
    joined: '2026-07-02T16:20:00.000Z',
    lastOnline: '2026-07-14T14:58:00.000Z',
    biography: 'Frequent reporter and active participant.',
  },
]

const warnings = [
  {
    id: 'aaaaaaaa-1111-1111-1111-111111111111',
    userId: '33333333-3333-3333-3333-333333333333',
    message: 'Please keep discussion focused on course content.',
    createdAt: '2026-07-10T11:10:00.000Z',
    createdFrom: '11111111-1111-1111-1111-111111111111',
  },
]

const commentReports = [
  {
    id: '99999999-9999-9999-9999-999999999999',
    commentContent: 'This lecture thread went off topic and includes personal attacks.',
    postContext: 'Software Engineering Practice',
    reportText: 'Contains hostile language toward another student.',
    reportedUserId: '33333333-3333-3333-3333-333333333333',
    reporterId: '44444444-4444-4444-4444-444444444444',
    reason: 'INSULT',
    status: 'OPEN',
    date: '2026-07-13T15:40:00.000Z',
  },
  {
    id: '99999999-9999-9999-9999-999999999998',
    commentContent: 'Can someone share the exercise sheet solution?',
    postContext: 'Algorithms II',
    reportText: 'Possible academic integrity issue.',
    reportedUserId: '22222222-2222-2222-2222-222222222222',
    reporterId: '44444444-4444-4444-4444-444444444444',
    reason: 'OTHER',
    status: 'REVIEWED',
    date: '2026-07-12T09:05:00.000Z',
  },
]

const bugReports = [
  {
    id: '12121212-1212-1212-1212-121212121212',
    title: 'Dashboard count does not refresh',
    description: 'After resolving a comment report the dashboard cards still show the old number until a reload.',
    severity: 'MEDIUM',
    status: 'OPEN',
    reporterId: '44444444-4444-4444-4444-444444444444',
    reportedAt: '2026-07-14T12:10:00.000Z',
  },
  {
    id: '13131313-1313-1313-1313-131313131313',
    title: 'Profile modal closes on slow network',
    description: 'When the user detail request is slow the modal occasionally closes before content loads.',
    severity: 'LOW',
    status: 'REVIEWED',
    reporterId: '22222222-2222-2222-2222-222222222222',
    reportedAt: '2026-07-12T17:30:00.000Z',
  },
]

const auditLogs = [
  {
    id: 'abababab-1111-1111-1111-111111111111',
    action: 'USER_WARNING_CREATED',
    target: {
      type: 'USER',
      id: '33333333-3333-3333-3333-333333333333',
      label: 'JonasB (jonas@student.kit.edu)',
    },
    changes: {
      warnings: { before: 0, after: 1 },
    },
    metadata: {
      reason: 'Please keep discussion focused on course content.',
    },
    createdAt: '2026-07-10T11:10:00.000Z',
  },
  {
    id: 'abababab-2222-2222-2222-222222222222',
    action: 'COMMENT_REPORT_STATUS_CHANGED',
    target: {
      type: 'COMMENT_REPORT',
      id: '99999999-9999-9999-9999-999999999998',
      label: 'Report about MiraK in Algorithms II',
    },
    changes: {
      status: { before: 'OPEN', after: 'REVIEWED' },
    },
    metadata: {},
    createdAt: '2026-07-12T10:15:00.000Z',
  },
  {
    id: 'abababab-3333-3333-3333-333333333333',
    action: 'ADMIN_LOGIN',
    target: {
      type: 'ADMIN_SESSION',
      id: '11111111-1111-1111-1111-111111111111',
      label: 'Alparslan admin session',
    },
    changes: {
      authenticated: { before: false, after: true },
    },
    metadata: {
      method: 'EMAIL_OTP',
    },
    createdAt: '2026-07-14T15:25:00.000Z',
  },
]

async function createSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS mock_users (
      id uuid PRIMARY KEY,
      username text NOT NULL,
      kit_email text NOT NULL UNIQUE,
      role text NOT NULL CHECK (role IN ('STUDENT', 'ADMIN')),
      status text NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED', 'DELETED')),
      joined timestamptz NOT NULL,
      last_online timestamptz NOT NULL,
      biography text NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS mock_tokens (
      value text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES mock_users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL,
      revoked boolean NOT NULL DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS mock_login_codes (
      email text PRIMARY KEY,
      code text NOT NULL,
      expires_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mock_warnings (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES mock_users(id) ON DELETE CASCADE,
      message text NOT NULL,
      created_at timestamptz NOT NULL,
      created_from uuid REFERENCES mock_users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS mock_comment_reports (
      id uuid PRIMARY KEY,
      comment_content text NOT NULL,
      post_context text NOT NULL,
      report_text text NOT NULL,
      reported_user_id uuid NOT NULL REFERENCES mock_users(id) ON DELETE CASCADE,
      reporter_id uuid NOT NULL REFERENCES mock_users(id) ON DELETE CASCADE,
      reason text NOT NULL CHECK (reason IN ('SPAM', 'INSULT', 'HARASSMENT', 'HATE_SPEECH', 'PERSONAL_INFORMATION', 'OFF_TOPIC', 'INAPPROPRIATE_CONTENT', 'OTHER')),
      status text NOT NULL CHECK (status IN ('OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN')),
      date timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mock_bug_reports (
      id uuid PRIMARY KEY,
      title text NOT NULL,
      description text NOT NULL,
      severity text NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
      status text NOT NULL CHECK (status IN ('OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN')),
      reporter_id uuid REFERENCES mock_users(id) ON DELETE SET NULL,
      reported_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mock_audit_logs (
      id uuid PRIMARY KEY,
      actor_type text NOT NULL CHECK (actor_type IN ('ADMIN', 'USER')),
      actor_id uuid,
      actor_name text NOT NULL,
      actor_email text NOT NULL,
      actor_role text NOT NULL,
      action text NOT NULL CHECK (
        action IN (
          'ADMIN_LOGIN',
          'ADMIN_LOGOUT',
          'USER_WARNING_CREATED',
          'USER_BLOCKED',
          'USER_UNBLOCKED',
          'USER_DELETED',
          'COMMENT_REPORT_STATUS_CHANGED',
          'BUG_REPORT_UPDATED'
        )
      ),
      target_type text,
      target_id text,
      target_label text,
      changes jsonb NOT NULL DEFAULT '{}'::jsonb,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL
    );

    CREATE INDEX IF NOT EXISTS mock_audit_logs_created_at_id_idx
      ON mock_audit_logs (created_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS mock_audit_logs_actor_id_idx
      ON mock_audit_logs (actor_id);
    CREATE INDEX IF NOT EXISTS mock_audit_logs_action_idx
      ON mock_audit_logs (action);
    CREATE INDEX IF NOT EXISTS mock_audit_logs_target_type_idx
      ON mock_audit_logs (target_type);
  `)
}

async function seedUsers(client) {
  for (const user of users) {
    await client.query(
      `
        INSERT INTO mock_users (id, username, kit_email, role, status, joined, last_online, biography)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [user.id, user.username, user.kitEmail, user.role, user.status, user.joined, user.lastOnline, user.biography]
    )
  }
}

async function seedTokens(client) {
  const adminId = users[0].id
  for (const value of [demoAdminToken, 'mock-token-1', 'stored-token', 'admin-token', 'test-token']) {
    await client.query(
      'INSERT INTO mock_tokens (value, user_id, expires_at, revoked) VALUES ($1, $2, now() + interval \'365 days\', false)',
      [value, adminId]
    )
  }

  await client.query(
    'INSERT INTO mock_login_codes (email, code, expires_at) VALUES ($1, $2, now() + interval \'1 day\')',
    [users[0].kitEmail, demoLoginCode]
  )
}

async function seedWarnings(client) {
  for (const warning of warnings) {
    await client.query(
      `
        INSERT INTO mock_warnings (id, user_id, message, created_at, created_from)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [warning.id, warning.userId, warning.message, warning.createdAt, warning.createdFrom]
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
      ]
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
      [report.id, report.title, report.description, report.severity, report.status, report.reporterId, report.reportedAt]
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

async function seedAll(client) {
  await seedUsers(client)
  await seedTokens(client)
  await seedWarnings(client)
  await seedCommentReports(client)
  await seedBugReports(client)
  await seedAuditLogs(client)
}

export async function resetMockDatabase() {
  await withTransaction(async (client) => {
    await createSchema(client)
    await client.query(`
      TRUNCATE
        mock_audit_logs,
        mock_bug_reports,
        mock_comment_reports,
        mock_warnings,
        mock_login_codes,
        mock_tokens,
        mock_users
      CASCADE
    `)
    await seedAll(client)
  })
}

// Idempotent startup path: create the schema if missing and seed only when the
// database is empty, so restarting the API never discards data created at runtime.
export async function ensureMockDatabase() {
  await withTransaction(async (client) => {
    await createSchema(client)
    const { rows } = await client.query('SELECT count(*)::int AS count FROM mock_users')
    if (rows[0].count === 0) {
      await seedAll(client)
    }
  })
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  resetMockDatabase()
    .then(() => {
      console.log('Mock database seeded.')
    })
    .catch((error) => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(closePool)
}
