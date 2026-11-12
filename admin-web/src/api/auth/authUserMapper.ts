import type { AuthUser, SessionUserPayload } from './authTypes'

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/**
 * The panel's `AuthUser` from whatever `/auth/me` reported, or nothing when the response named
 * no usable account. The id decides: it is the value that appears as the actor on audit
 * entries, and an id the backend did not issue must never be sent back to it.
 */
/**
 * Maps `/auth/me`'s payload onto the panel's own `AuthUser`.
 *
 * Accepts both field spellings the backend has used — `username`/`kitEmail` and
 * `name`/`email` — because depending on the wrong one signed the operator out on every reload
 * (`F-002`). Answers `undefined` rather than a half-built user when the payload names no
 * usable id: an identity the panel invented once reached the backend as the author of a
 * warning.
 *
 * @param payload the `user` object as it arrived, or `undefined`
 * @returns the account, or `undefined` when the payload named nobody usable
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
