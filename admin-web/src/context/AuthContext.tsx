import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { apiClient } from '../api/ApiClient'
import { authService } from '../api/AuthService'
import { AuthContext, type AuthUser } from './AuthContextValue'
import {
  clearStoredSession,
  EMPTY_AUTH_STATE,
  readStoredSession,
  storeSession,
  type AuthState,
} from './authSessionStorage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(readStoredSession)

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    storeSession(newToken, newUser)
    setAuth({ token: newToken, user: newUser })
  }, [])

  const clearSession = useCallback(() => {
    clearStoredSession()
    setAuth(EMPTY_AUTH_STATE)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Signing out locally is still safer when the backend cannot be reached.
    } finally {
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    // Drop the session when the backend rejects our token (expired/revoked).
    apiClient.setOnUnauthorized(clearSession)
    return () => apiClient.setOnUnauthorized(null)
  }, [clearSession])

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
