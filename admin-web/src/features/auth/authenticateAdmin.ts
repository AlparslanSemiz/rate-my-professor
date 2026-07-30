import { ApiError, apiClient, EMPTY_RESPONSE_MESSAGE } from '../../api/ApiClient'
import { authService, type AuthUser } from '../../api/AuthService'
import { usersService, type User } from '../../api/UsersService'
import {
  getRequiredAdminUser,
  hasAdminAccess,
  isRequiredAdminEmail,
  normalizeEmail,
  withRequiredAdminRole,
} from '../../utils/adminAccess'
import { getErrorMessage } from '../../utils/getErrorMessage'

const LOGIN_ERROR_FALLBACK = 'Login failed'
export const ADMIN_ACCESS_ERROR = 'Login succeeded, but this account is not authorized for the admin panel.'

/** Shown to an address that is not on the admin list, before any code is requested. */
export const NOT_AN_ADMIN_ERROR =
  'You do not have access to this panel. It is limited to the admin team, so no login code was sent.'

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

async function resolveAdminUser(email: string): Promise<AuthUser> {
  const requiredAdminUser = getRequiredAdminUser(email)
  let users: User[] = []

  try {
    users = await usersService.getAll()
  } catch (error: unknown) {
    if (!requiredAdminUser) throw error
  }

  const currentUser = findUserByEmail(users, email)
  if (!currentUser && requiredAdminUser) return requiredAdminUser
  if (!currentUser) {
    throw new Error('Logged in, but could not find your admin account')
  }

  const adminUser = withRequiredAdminRole(currentUser)
  if (!hasAdminAccess(adminUser)) {
    throw new Error(ADMIN_ACCESS_ERROR)
  }
  return toAuthUser(adminUser)
}

export function getLoginErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.message === EMPTY_RESPONSE_MESSAGE) {
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
