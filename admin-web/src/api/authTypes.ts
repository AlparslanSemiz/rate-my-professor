import type { BasicResponse } from './ApiClient'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  /**
   * Whether this account may also moderate other admin accounts. The backend is the authority:
   * it answers `false` for students and ordinary admins, and it is what actually authorizes the
   * request. Optional because a session stored before the backend reported it carries no flag.
   */
  isSuperAdmin?: boolean
}

export interface LoginResponse extends BasicResponse {
  authToken: string
}

/**
 * The user as `/auth/me` puts it on the wire. The backend names these fields `username` and
 * `kitEmail`, as it does on `/users`; the older `name` / `email` spelling is still accepted so
 * the panel does not depend on which one this endpoint happens to use. Everything is optional
 * because none of it is promised — the response is not validated by the client.
 */
export interface SessionUserPayload {
  id?: unknown
  username?: unknown
  name?: unknown
  kitEmail?: unknown
  email?: unknown
  role?: unknown
  isSuperAdmin?: unknown
}

/** `/auth/me` before the payload is mapped onto the panel's own `AuthUser`. */
export interface SessionPayload extends BasicResponse {
  user?: SessionUserPayload
}

/** What `/auth/me` reports about the token currently held. */
export interface SessionResponse extends BasicResponse {
  user?: AuthUser
}
