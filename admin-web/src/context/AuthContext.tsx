import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from './AuthContextValue'
import { apiClient } from '../api/ApiClient'

function readStoredUser(): AuthUser | null {
  const stored = localStorage.getItem('user')
  if (!stored) return null

  try {
    return JSON.parse(stored) as AuthUser
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    apiClient.setToken(null)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // Set the token on the client synchronously: child effects run before this
    // provider's effects, so pages would otherwise fire their first requests
    // without the Authorization header after a page refresh.
    const stored = localStorage.getItem('token')
    apiClient.setToken(stored)
    return stored
  })
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)

  function login(newToken: string, newUser: AuthUser) {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    apiClient.setToken(newToken)
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    apiClient.setToken(null)
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
