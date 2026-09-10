import { http } from 'msw'
import { apiUrl } from '../apiUrl'
import { failure, ok } from '../envelope'

/**
 * `/auth/*`, including the two refusals that decide what the panel does about a session.
 *
 * The signed-in account is module state rather than part of `db`, because it is not a
 * collection: a test either has a session or does not.
 */

const RATE_LIMIT_MESSAGE = 'Too many login codes requested'
const RETRY_AFTER_SECONDS = '60'

interface SessionUser {
  id: string
  username: string
  kitEmail: string
  role: string
  isSuperAdmin?: boolean
}

/**
 * Three states, not two, because the panel treats them as three.
 *
 * `undefined` is a token the backend accepts while naming nobody — the response carries no
 * `user`, which the provider reads as "not a correction" and leaves the stored session alone.
 * `null` is a token it no longer accepts, which is the `401` that ends a session. A user is
 * the ordinary case. Collapsing the first two would make it impossible to test the difference,
 * and the difference is a documented decision.
 */
let sessionUser: SessionUser | null | undefined

/**
 * Who `/auth/me` will report.
 *
 * @param user the account; `null` for a token the backend no longer accepts, `undefined` for
 *        one it accepts without naming anybody
 */
export function setSessionUser(user: SessionUser | null | undefined): void {
  sessionUser = user
}

/** Back to "accepted, names nobody", which is the least opinionated default. */
export function resetSession(): void {
  sessionUser = undefined
}

export const authHandlers = [
  http.post(apiUrl('/auth/request-login'), () => ok({}, 'Login code sent')),

  http.post(apiUrl('/auth/login'), () => ok({ authToken: 'admin-token' }, 'Signed in')),

  http.post(apiUrl('/auth/logout'), () => {
    sessionUser = undefined
    return ok({}, 'Signed out')
  }),

  http.get(apiUrl('/auth/me'), () => {
    if (sessionUser === null) return failure(401, 'Token is no longer valid')
    if (sessionUser === undefined) return ok({}, 'Signed in')
    return ok({ user: sessionUser }, 'Signed in')
  }),
]

/** The backend's rate limit on login codes, which is reachable in ordinary use. */
export function rateLimitLoginCodes() {
  return http.post(apiUrl('/auth/request-login'), () =>
    failure(429, RATE_LIMIT_MESSAGE, undefined, { 'Retry-After': RETRY_AFTER_SECONDS }),
  )
}

/**
 * The backend refusing the stored token **once**.
 *
 * One-shot rather than permanent, because that is the situation worth testing: the token in
 * storage has been revoked, the operator is thrown out, and then they sign in again and the
 * new token works. A permanently refusing `/auth/me` cannot express the second half.
 */
export function expireStoredSessionOnce() {
  return http.get(apiUrl('/auth/me'), () => failure(401, 'Token is no longer valid'), {
    once: true,
  })
}

/** The backend refusing an account the admin panel. */
export function refuseAdminAccess() {
  return http.post(apiUrl('/auth/login'), () => failure(403, 'Not an admin'))
}

/**
 * The session check failing for a reason that is **not** a refusal.
 *
 * Separate from {@link expireStoredSessionOnce} because the panel treats the two differently:
 * a `401` ends the session, while a `404` — the legacy path removed — leaves the operator
 * signed in with an account copy nothing has confirmed. That second case had no fixture, which
 * is why it went unnoticed (`F-013`).
 *
 * @param status the failing status to answer with
 * @param message the envelope's message
 */
export function failSessionCheck(status: number, message: string) {
  return http.get(apiUrl('/auth/me'), () => failure(status, message))
}
