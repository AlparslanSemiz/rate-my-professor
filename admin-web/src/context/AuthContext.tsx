import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from './AuthContextValue'
import { apiClient } from '../api/ApiClient'
import { getDemoAdminTokenForEmail } from '../utils/demoAuth'

const TOKEN_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'user'
const AUTH_USER_FIELDS = ['id', 'name', 'email', 'role'] as const

function clearStoredSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
  apiClient.setToken(null)
}

function storeSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  apiClient.setToken(token)
}

interface AuthState {
  token: string | null
  user: AuthUser | null
}

const emptyAuthState: AuthState = { token: null, user: null }

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>
  return AUTH_USER_FIELDS.every((field) => {
    const fieldValue = candidate[field]
    return typeof fieldValue === 'string' && fieldValue.trim().length > 0
  })
}

function readStoredSession(): AuthState {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const stored = localStorage.getItem(USER_STORAGE_KEY)
  if (!token && !stored) {
    apiClient.setToken(null)
    return emptyAuthState
  }
  if (!token || !stored) {
    clearStoredSession()
    return emptyAuthState
  }

  try {
    const user: unknown = JSON.parse(stored)
    if (!isAuthUser(user)) {
      clearStoredSession()
      return emptyAuthState
    }

    const demoToken = getDemoAdminTokenForEmail(user.email)
    const activeToken = demoToken ?? token
    if (demoToken && demoToken !== token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, demoToken)
    }
    apiClient.setToken(activeToken)
    return { token: activeToken, user }
  } catch {
    clearStoredSession()
    return emptyAuthState
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(readStoredSession)

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    storeSession(newToken, newUser)
    setAuth({ token: newToken, user: newUser })
  }, [])

  const logout = useCallback(() => {
    clearStoredSession()
    setAuth(emptyAuthState)
  }, [])

  useEffect(() => {
    // Drop the session when the backend rejects our token (expired/revoked).
    apiClient.setOnUnauthorized(() => logout())
    return () => apiClient.setOnUnauthorized(null)
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        token: auth.token,
        login,
        logout,
        isAuthenticated: !!auth.token && !!auth.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
