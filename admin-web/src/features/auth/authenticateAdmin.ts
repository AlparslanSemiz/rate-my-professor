import { ApiError, apiClient } from '../../api/ApiClient'
import { authService, type AuthUser } from '../../api/AuthService'
import { isRequiredAdminEmail, withRequiredAdminRole } from '../../utils/adminAccess'
import { getErrorMessage } from '../../utils/getErrorMessage'

const LOGIN_ERROR_FALLBACK = 'Login failed'
export const ADMIN_ACCESS_ERROR = 'Login succeeded, but this account is not authorized for the admin panel.'

/** Shown to an address that is not on the admin list, before any code is requested. */
export const NOT_AN_ADMIN_ERROR =
  'You do not have access to this panel. It is limited to the admin team, so no login code was sent.'

const IDENTITY_ERROR =
  'Signed in, but your admin account could not be read. Try again in a moment.'

/**
 * The signed-in admin as the backend knows them. `/auth/me` is the only source: it answers
 * with the real account id — the one that appears as the actor on audit entries — and the
 * panel has no other way to learn an id the backend actually issued.
 *
 * Never invents an identity. An id the backend did not issue used to reach it right back as
 * the author of a warning, so failing the login is the honest outcome when the session
 * cannot say who this is.
 */
async function resolveAdminUser(): Promise<AuthUser> {
  const user = await readSessionUser()
  if (!user) throw new Error(IDENTITY_ERROR)
  return withRequiredAdminRole(user)
}

async function readSessionUser(): Promise<AuthUser | null> {
  try {
    // `me()` already refuses a payload that names no usable id, so an answer here is either
    // a real account or nothing at all.
    return (await authService.me()).user ?? null
  } catch {
    // The sign-in itself succeeded; only this read failed. Passing its own message on would
    // describe the login as the thing that went wrong.
    return null
  }
}

/** Shown when the backend rate-limits the login code request. */
export const CODE_RATE_LIMITED_ERROR =
  'Too many login codes have been requested. Wait a minute, then ask for a new one.'

/**
 * A refused code request. `429` is worth its own wording: the backend does not promise a
 * message here, so without this the operator is told "Request to /auth/request-login failed
 * with status 429" — which reads as a broken panel rather than as "you asked too often".
 */
export function getRequestCodeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 429) {
    return CODE_RATE_LIMITED_ERROR
  }
  return getErrorMessage(error, fallback)
}

/**
 * A 403 is the backend refusing this account the admin panel, which is the one case where
 * "not authorized" is the right thing to say. Every other failure keeps its own message:
 * deciding authorization by matching on an error string reported the wrong reason whenever
 * an unrelated call in the login path happened to fail the same way.
 */
export function getLoginErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return ADMIN_ACCESS_ERROR
  }
  return getErrorMessage(error, LOGIN_ERROR_FALLBACK)
}

export async function authenticateAdmin(email: string, code: string): Promise<{ token: string; user: AuthUser }> {
  // Checked again here, not only before the code was requested: the address can be edited
  // between the two steps, and `/auth/login` serves students as well.
  if (!isRequiredAdminEmail(email)) {
    throw new Error(NOT_AN_ADMIN_ERROR)
  }

  const { token } = await authService.login(email, code)

  apiClient.setToken(token)
  return { token, user: await resolveAdminUser() }
}
