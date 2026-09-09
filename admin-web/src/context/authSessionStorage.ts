import { z } from 'zod'
import { apiClient } from '@/api/client'
import type { AuthUser } from './AuthContextValue'

const TOKEN_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'user'

// `refine` rather than `.trim().min(1)`: the latter would also *transform*, quietly rewriting
// a stored name on every load. This validates exactly what the hand-written guard did and
// hands the value back untouched.
const requiredText = z.string().refine((value) => value.trim().length > 0)

/**
 * What a stored session has to look like to be trusted on the next load.
 *
 * `isSuperAdmin` is optional on purpose: a session stored before the backend reported the
 * flag is still a valid session, and an absent flag simply means "not elevated" until
 * `/auth/me` says otherwise. Anything that is neither absent nor a boolean is a payload we
 * did not write, and the whole session goes.
 */
const storedUserSchema = z.object({
  id: requiredText,
  name: requiredText,
  email: requiredText,
  role: requiredText,
  isSuperAdmin: z.boolean().optional(),
})

export interface AuthState {
  token: string | null
  user: AuthUser | null
}

export const EMPTY_AUTH_STATE: AuthState = { token: null, user: null }

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
    const parsed = storedUserSchema.safeParse(JSON.parse(storedUser))
    if (!parsed.success) {
      clearStoredSession()
      return EMPTY_AUTH_STATE
    }

    apiClient.setToken(token)
    return { token, user: parsed.data }
  } catch {
    clearStoredSession()
    return EMPTY_AUTH_STATE
  }
}
