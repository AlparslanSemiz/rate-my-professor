import { apiClient } from '../api/ApiClient'
import type { AuthUser } from './AuthContextValue'

const TOKEN_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'user'
const AUTH_USER_STRING_FIELDS = ['id', 'name', 'email', 'role'] as const

export interface AuthState {
  token: string | null
  user: AuthUser | null
}

export const EMPTY_AUTH_STATE: AuthState = { token: null, user: null }

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>
  const hasFields = AUTH_USER_STRING_FIELDS.every((field) => {
    const fieldValue = candidate[field]
    return typeof fieldValue === 'string' && fieldValue.trim().length > 0
  })
  if (!hasFields) return false

  // Optional on purpose: a session stored before the backend reported the flag is still a
  // valid session, and an absent flag simply means "not elevated" until `/auth/me` says
  // otherwise. Anything that is neither absent nor a boolean is a payload we did not write.
  return candidate.isSuperAdmin === undefined || typeof candidate.isSuperAdmin === 'boolean'
}

export function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
  apiClient.setToken(null)
}

export function storeSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  apiClient.setToken(token)
}

export function readStoredSession(): AuthState {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const storedUser = localStorage.getItem(USER_STORAGE_KEY)

  if (!token && !storedUser) {
    apiClient.setToken(null)
    return EMPTY_AUTH_STATE
  }
  if (!token || !storedUser) {
    clearStoredSession()
    return EMPTY_AUTH_STATE
  }

  try {
    const user: unknown = JSON.parse(storedUser)
    if (!isAuthUser(user)) {
      clearStoredSession()
      return EMPTY_AUTH_STATE
    }

    apiClient.setToken(token)
    return { token, user }
  } catch {
    clearStoredSession()
    return EMPTY_AUTH_STATE
  }
}
