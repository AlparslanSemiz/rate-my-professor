import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ApiError, apiClient } from '../api/ApiClient'
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
  // A token in localStorage is a claim, not proof: it may have been revoked while the tab
  // was closed. Until `/auth/me` confirms it, the session is unverified rather than valid.
  const [checking, setChecking] = useState(() => auth.token !== null)
  const [sessionExpired, setSessionExpired] = useState(false)

  const clearSession = useCallback(() => {
    clearStoredSession()
    setAuth(EMPTY_AUTH_STATE)
  }, [])

  /** Ends a session the backend refused, so the login screen can say why. */
  const expireSession = useCallback(() => {
    setSessionExpired(true)
    clearSession()
  }, [clearSession])

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    storeSession(newToken, newUser)
    setSessionExpired(false)
    setChecking(false)
    setAuth({ token: newToken, user: newUser })
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Signing out locally is still safer when the backend cannot be reached.
    } finally {
      setSessionExpired(false)
      clearSession()
    }
  }, [clearSession])

  const acknowledgeExpiry = useCallback(() => setSessionExpired(false), [])

  useEffect(() => {
    // Drop the session when the backend rejects our token (expired/revoked).
    apiClient.setOnUnauthorized(expireSession)
    return () => apiClient.setOnUnauthorized(null)
  }, [expireSession])

  useEffect(() => {
    if (!checking) return

    let cancelled = false

    authService
      .me()
      .catch((error: unknown) => {
        // Only a refusal ends the session. A backend that is down or unreachable says
        // nothing about whether the token is still good, and signing the admin out over a
        // network blip would lose their place for no reason.
        if (!cancelled && error instanceof ApiError && error.status === 401) expireSession()
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [checking, expireSession])

  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        token: auth.token,
        login,
        logout,
        isAuthenticated: !!auth.token && !!auth.user,
        checking,
        sessionExpired,
        acknowledgeExpiry,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
