import crypto from 'node:crypto'

export const AUDIT_ACTIONS = [
  'ADMIN_LOGIN',
  'ADMIN_LOGOUT',
  'USER_WARNING_CREATED',
  'USER_BLOCKED',
  'USER_UNBLOCKED',
  'USER_DELETED',
  'COMMENT_REPORT_STATUS_CHANGED',
  'BUG_REPORT_UPDATED',
]

export const AUDIT_TARGET_TYPES = ['ADMIN_SESSION', 'USER', 'COMMENT_REPORT', 'BUG_REPORT']

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

export function userTarget(user) {
  return {
    type: 'USER',
    id: user.id,
    label: `${user.username} (${user.kit_email})`,
  }
}
