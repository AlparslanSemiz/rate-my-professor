import type { AuthUser, SessionUserPayload } from './authTypes'

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/**
 * The panel's `AuthUser` from whatever `/auth/me` reported, or nothing when the response named
 * no usable account. The id decides: it is the value that appears as the actor on audit
 * entries, and an id the backend did not issue must never be sent back to it.
 */
export function toAuthUser(payload: SessionUserPayload | undefined): AuthUser | undefined {
  if (!payload) return undefined

  const id = readString(payload.id).trim()
  if (!id) return undefined

  return {
    id,
    name: readString(payload.username) || readString(payload.name),
    email: readString(payload.kitEmail) || readString(payload.email),
    role: readString(payload.role),
    isSuperAdmin: payload.isSuperAdmin === true,
  }
}
