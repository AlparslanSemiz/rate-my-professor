import crypto from 'node:crypto'

/**
 * One table holds both logs, split by the scope an action belongs to — the same way the real
 * backend does it. `/audit-logs` serves the administrative half and `/activity-logs` serves the
 * rest, so a refused admin login lands next to every other refusal.
 */
export const ADMINISTRATIVE_ACTIONS = [
  'ADMIN_LOGIN',
  'ADMIN_LOGOUT',
  'USER_UPDATED',
  'USER_WARNING_CREATED',
  'USER_WARNING_UPDATED',
  'USER_WARNING_DELETED',
  'USER_BLOCKED',
  'USER_UNBLOCKED',
  'USER_DELETED',
  'COMMENT_UPDATED',
  'COMMENT_DELETED',
  'ANSWER_UPDATED',
  'ANSWER_DELETED',
  'RATING_DELETED',
  'COMMENT_REPORT_STATUS_CHANGED',
  'COMMENT_REPORT_DELETED',
  'ANSWER_REPORT_STATUS_CHANGED',
  'ANSWER_REPORT_DELETED',
  'BUG_REPORT_UPDATED',
  'BUG_REPORT_DELETED',
  'LECTURE_UPDATED',
  'LECTURE_DELETED',
  'PROFESSOR_UPDATED',
  'PROFESSOR_DELETED',
]

export const ACTIVITY_ACTIONS = [
  'USER_LOGIN',
  'USER_LOGOUT',
  'COMMENT_CREATED',
  'ANSWER_CREATED',
  'RATING_SUBMITTED',
  'COMMENT_REPORT_CREATED',
  'ANSWER_REPORT_CREATED',
  'BUG_REPORT_CREATED',
  'LOGIN_REFUSED',
  'ACCESS_REFUSED',
]

export const ALL_ACTIONS = [...ADMINISTRATIVE_ACTIONS, ...ACTIVITY_ACTIONS]

export const LOG_TARGET_TYPES = [
  'ADMIN_SESSION',
  'USER_SESSION',
  'USER',
  'WARNING',
  'COMMENT',
  'ANSWER',
  'RATING',
  'LECTURE',
  'PROFESSOR',
  'COMMENT_REPORT',
  'ANSWER_REPORT',
  'BUG_REPORT',
  'ENDPOINT',
]

export const LOG_ACTOR_TYPES = ['ADMIN', 'USER']

export async function insertAuditLog(client, {
  id = crypto.randomUUID(),
  actor,
  action,
  target = null,
  changes = {},
  metadata = {},
  createdAt = new Date(),
}) {
  await client.query(
    `
      INSERT INTO mock_audit_logs (
        id,
        actor_type,
        actor_id,
        actor_name,
        actor_email,
        actor_role,
        action,
        target_type,
        target_id,
        target_label,
        changes,
        metadata,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13)
    `,
    [
      id,
      actor.type ?? 'ADMIN',
      actor.id,
      actor.name,
      actor.email,
      actor.role,
      action,
      target?.type ?? null,
      target?.id ?? null,
      target?.label ?? null,
      JSON.stringify(changes),
      JSON.stringify(metadata),
      createdAt,
    ]
  )
}

export function adminActor(user) {
  return {
    type: 'ADMIN',
    id: user.id,
    name: user.username,
    email: user.kit_email,
    role: user.role,
  }
}

/** Actor snapshot for a fixture row, where the fields are camelCase rather than columns. */
export function fixtureActor(user) {
  return {
    type: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
    id: user.id,
    name: user.username,
    email: user.kitEmail,
    role: user.role,
  }
}

export function userTarget(user) {
  return {
    type: 'USER',
    id: user.id,
    label: `${user.username} (${user.kit_email})`,
  }
}
