import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from './AuthContextValue'
import { apiClient } from '../api/ApiClient'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // Set the token on the client synchronously: child effects run before this
    // provider's effects, so pages would otherwise fire their first requests
    // without the Authorization header after a page refresh.
    const stored = localStorage.getItem('token')
    apiClient.setToken(stored)
    return stored
  })
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

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
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}
