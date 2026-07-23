import { ApiError, apiClient, EMPTY_RESPONSE_MESSAGE } from '../../api/ApiClient'
import { authService, type AuthUser } from '../../api/AuthService'
import { usersService, type User } from '../../api/UsersService'
import {
  getRequiredAdminUser,
  hasAdminAccess,
  normalizeEmail,
  withRequiredAdminRole,
} from '../../utils/adminAccess'
import { getDemoAdminTokenForEmail, isDemoLoginCode } from '../../utils/demoAuth'
import { getErrorMessage } from '../../utils/getErrorMessage'

const LOGIN_ERROR_FALLBACK = 'Login failed'
export const ADMIN_ACCESS_ERROR = 'Login succeeded, but this account is not authorized for the admin panel.'

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
  const demoToken = getDemoAdminTokenForEmail(email)
  if (demoToken && !isDemoLoginCode(code)) {
    throw new Error('Invalid token')
  }

  // Even the local demo completes the backend exchange so successful admin
  // logins are recorded and the server remains the source of session truth.
  const { token } = await authService.login(email, code)

  apiClient.setToken(token)
  return { token, user: await resolveAdminUser(email) }
}
