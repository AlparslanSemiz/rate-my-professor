import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from './AuthContextValue'
import { apiClient } from '../api/ApiClient'

const TOKEN_STORAGE_KEY = 'token'
const USER_STORAGE_KEY = 'user'

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

function readStoredUser(): AuthUser | null {
  const stored = localStorage.getItem(USER_STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as AuthUser
  } catch {
    clearStoredSession()
    return null
  }
}

function readStoredToken() {
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
  apiClient.setToken(stored)
  return stored
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // Set the token on the client synchronously: child effects run before this
    // provider's effects, so pages would otherwise fire their first requests
    // without the Authorization header after a page refresh.
    return readStoredToken()
  })
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)

  function login(newToken: string, newUser: AuthUser) {
    storeSession(newToken, newUser)
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    clearStoredSession()
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    // Drop the session when the backend rejects our token (expired/revoked).
    apiClient.setOnUnauthorized(() => logout())
    return () => apiClient.setOnUnauthorized(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  )
}
