import { ApiError, apiClient } from '../../api/ApiClient'
import { authService, type AuthUser } from '../../api/AuthService'
import { usersService, type User } from '../../api/UsersService'
import { isRequiredAdminEmail, normalizeEmail, withRequiredAdminRole } from '../../utils/adminAccess'
import { getErrorMessage } from '../../utils/getErrorMessage'

const LOGIN_ERROR_FALLBACK = 'Login failed'
export const ADMIN_ACCESS_ERROR = 'Login succeeded, but this account is not authorized for the admin panel.'

/** Shown to an address that is not on the admin list, before any code is requested. */
export const NOT_AN_ADMIN_ERROR =
  'You do not have access to this panel. It is limited to the admin team, so no login code was sent.'

const IDENTITY_ERROR =
  'Signed in, but your admin account could not be read. Try again in a moment.'

function findUserByEmail(users: User[], email: string) {
  const normalizedEmail = normalizeEmail(email)
  return users.find((user) => normalizeEmail(user.kitEmail) === normalizedEmail)
}

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.username,
    email: user.kitEmail,
    role: user.role,
  }
}

/**
 * The signed-in admin as the backend knows them. `/auth/me` is asked first because it answers
 * with the real account id — the one that appears as the actor on audit entries, and the one
 * sent as the issuer of every warning.
 */
async function identityFromSession(): Promise<AuthUser | null> {
  try {
    const session = await authService.me()
    const user = session.user
    if (!user || typeof user.id !== 'string' || !user.id.trim()) return null
    return withRequiredAdminRole(user)
  } catch {
    // Whether `/auth/me` returns the user is not settled yet, so a failure here is not a
    // failure to log in: the account is looked up in the user list instead.
    return null
  }
}

/** Fallback for a backend whose `/auth/me` reports only whether the token is still good. */
async function identityFromUserList(email: string): Promise<AuthUser | null> {
  try {
    const currentUser = findUserByEmail(await usersService.getAll(), email)
    return currentUser ? toAuthUser(withRequiredAdminRole(currentUser)) : null
  } catch {
    return null
  }
}

/**
 * Never invents an identity. An id the backend did not issue used to reach it right back as
 * the author of a warning, so failing the login is the honest outcome when neither source
 * can say who this is.
 */
async function resolveAdminUser(email: string): Promise<AuthUser> {
  const adminUser = (await identityFromSession()) ?? (await identityFromUserList(email))
  if (!adminUser) throw new Error(IDENTITY_ERROR)
  return adminUser
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
  return { token, user: await resolveAdminUser(email) }
}
