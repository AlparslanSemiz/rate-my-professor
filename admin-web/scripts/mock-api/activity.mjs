import crypto from 'node:crypto'
import { query } from './db.mjs'

/**
 * Activity types are an open set on purpose: the real backend derives them from its own
 * controllers. This list is what the local API can produce or has seeded.
 */
export const ACTIVITY_TYPES = [
  'USER_REGISTERED',
  'LOGIN_CODE_REQUESTED',
  'USER_LOGIN',
  'USER_LOGIN_FAILED',
  'USER_LOGOUT',
  'PROFILE_UPDATED',
  'POST_CREATED',
  'POST_DELETED',
  'COMMENT_CREATED',
  'COMMENT_DELETED',
  'COMMENT_REPORTED',
  'BUG_REPORT_SUBMITTED',
  'ADMIN_ACCESS_DENIED',
]

export const ACTIVITY_TARGET_TYPES = [
  'SESSION',
  'USER',
  'POST',
  'COMMENT',
  'COMMENT_REPORT',
  'BUG_REPORT',
  'ADMIN_ENDPOINT',
]

export const ACTIVITY_OUTCOMES = ['SUCCESS', 'FAILURE', 'DENIED']

export async function insertActivityLog(client, {
  id = crypto.randomUUID(),
  type,
  actor = null,
  target = null,
  context = null,
  metadata = {},
  outcome = 'SUCCESS',
  createdAt = new Date(),
}) {
  await client.query(
    `
      INSERT INTO mock_activity_logs (
        id,
        type,
        actor_type,
        actor_id,
        actor_name,
        actor_email,
        actor_role,
        target_type,
        target_id,
        target_label,
        route,
        method,
        ip,
        user_agent,
        metadata,
        outcome,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17)
    `,
    [
      id,
      type,
      actor?.type ?? null,
      actor?.id ?? null,
      actor?.name ?? null,
      actor?.email ?? null,
      actor?.role ?? null,
      target?.type ?? null,
      target?.id ?? null,
      target?.label ?? null,
      context?.route ?? null,
      context?.method ?? null,
      context?.ip ?? null,
      context?.userAgent ?? null,
      JSON.stringify(metadata),
      outcome,
      createdAt,
    ],
  )
}

/**
 * Fire-and-forget write used from request handlers. Recording activity must never turn a
 * successful user action into a failed request, so a logging error is only reported here.
 */
export async function recordActivity(entry) {
  try {
    await insertActivityLog({ query }, entry)
  } catch (error) {
    console.error('Failed to record activity', error)
  }
}

export function activityActor(user) {
  if (!user) return null
  return {
    type: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
    id: user.id,
    name: user.username,
    email: user.kit_email,
    role: user.role,
  }
}

export function requestContext(req) {
  return {
    route: new URL(req.url, `http://${req.headers.host ?? 'localhost'}`).pathname,
    method: req.method,
    ip: req.socket?.remoteAddress ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  }
}
