import {
  apiClient,
  ForbiddenError,
  NotFoundError,
  RateLimitedError,
  UnauthorizedError,
} from '@/api/client'
import { authService, type AuthUser } from '@/api/auth'
import { isRequiredAdminEmail, withRequiredAdminRole } from '@/utils/adminAccess'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { IdentityUnavailableError, NotAnAdminError } from './loginErrors'

const LOGIN_ERROR_FALLBACK = 'Login failed'
export const ADMIN_ACCESS_ERROR = 'Login succeeded, but this account is not authorized for the admin panel.'

/** Shown to an address that is not on the admin list, before any code is requested. */
export const NOT_AN_ADMIN_ERROR =
  'You do not have access to this panel. It is limited to the admin team, so no login code was sent.'

const IDENTITY_ERROR =
  'Signed in, but your admin account could not be read. Try again in a moment.'

/**
 * Shown when the identity read answered `404`.
 *
 * Worth its own sentence because the generic one sends the operator to look at their own
 * account, and the account is not the problem: the address the panel asks at has stopped
 * answering. That is `F-005`'s countdown arriving, and it needs a maintainer, not a retry.
 */
export const IDENTITY_ROUTE_MISSING_ERROR =
  'Signed in, but this panel could not read your admin account: the server no longer answers where the panel asks. This needs a maintainer, not another attempt.'

/**
 * Shown when the identity read answered `401`.
 *
 * The token was minted seconds earlier and is already refused, so "try again in a moment" is
 * the one piece of advice that cannot work.
 */
export const IDENTITY_REFUSED_ERROR =
  'Signed in, but the server immediately refused the session. Ask for a new login code.'

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
  // `me()` already refuses a payload that names no usable id, so an answer here is either a
  // real account or nothing at all.
  const user = (await readSessionUser()).user ?? null
  if (!user) throw new IdentityUnavailableError(IDENTITY_ERROR)
  return withRequiredAdminRole(user)
}

/**
 * Asks who is signed in, and keeps what the failure *was*.
 *
 * The sign-in itself succeeded, so passing the read's own message on would describe the login
 * as the thing that went wrong — which is why this used to be a bare `catch` returning `null`.
 * But that discarded the type along with the message, and three of the four ways this can fail
 * deserve a different sentence (`F-014`). Discriminating on the type rather than on a status
 * is what ADR 0013 exists for.
 */
async function readSessionUser() {
  try {
    return await authService.me()
  } catch (error: unknown) {
    // The account is real and the backend refuses it the panel. That is the one case where
    // "not authorized" is the right thing to say, and `getLoginErrorMessage` already owns
    // that wording — so the type is passed on rather than translated here.
    if (error instanceof ForbiddenError) throw error
    if (error instanceof NotFoundError) throw new IdentityUnavailableError(IDENTITY_ROUTE_MISSING_ERROR)
    if (error instanceof UnauthorizedError) throw new IdentityUnavailableError(IDENTITY_REFUSED_ERROR)
    throw new IdentityUnavailableError(IDENTITY_ERROR)
  }
}

/** Shown when the backend rate-limits the login code request. */
export const CODE_RATE_LIMITED_ERROR =
  'Too many login codes have been requested. Wait a minute, then ask for a new one.'

/**
 * A refused code request. Rate limiting is worth its own wording: the backend does not
 * promise a message here, so without this the operator is told "Request to
 * /auth/request-login failed with status 429" — which reads as a broken panel rather than as
 * "you asked too often".
 *
 * @param error whatever the code request rejected with
 * @param fallback the message to use when the error explains nothing itself
 * @returns the message to show the operator
 */
export function getRequestCodeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof RateLimitedError) {
    return CODE_RATE_LIMITED_ERROR
  }
  return getErrorMessage(error, fallback)
}

/**
 * A `ForbiddenError` is the backend refusing this account the admin panel, which is the one
 * case where "not authorized" is the right thing to say. Every other failure keeps its own
 * message: deciding authorization by matching on an error string reported the wrong reason
 * whenever an unrelated call in the login path happened to fail the same way.
 *
 * @param error whatever the login rejected with
 * @returns the message to show the operator
 */
export function getLoginErrorMessage(error: unknown) {
  if (error instanceof ForbiddenError) {
    return ADMIN_ACCESS_ERROR
  }
  return getErrorMessage(error, LOGIN_ERROR_FALLBACK)
}

export async function authenticateAdmin(email: string, code: string): Promise<{ token: string; user: AuthUser }> {
  // Checked again here, not only before the code was requested: the address can be edited
  // between the two steps, and `/auth/login` serves students as well.
  if (!isRequiredAdminEmail(email)) {
    throw new NotAnAdminError(NOT_AN_ADMIN_ERROR)
  }

  const { token } = await authService.login(email, code)

  // The token has to be installed before `/auth/me` can be asked with it, so a failed read
  // would otherwise leave a live bearer token on a client whose sign-in was reported as
  // failed — the panel would keep sending it while showing the login screen (`F-015`).
  apiClient.setToken(token)
  try {
    return { token, user: await resolveAdminUser() }
  } catch (error: unknown) {
    apiClient.setToken(null)
    throw error
  }
}
