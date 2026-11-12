import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ApiError, apiClient, UnauthorizedError } from '@/api/client'
import { authService } from '@/api/auth'
import { AuthContext, type AuthUser } from './AuthContextValue'
import {
  clearStoredSession,
  EMPTY_AUTH_STATE,
  restoreSession,
  storeSession,
  type AuthState,
} from './authSessionStorage'

/**
 * Shown when `/auth/me` failed for a reason that does not end the session.
 *
 * Deliberately not the backend's own `message`: for the case this exists for — the legacy
 * `/auth/me` removed — that message is "Request to /auth/me failed with status 404", which
 * tells the operator nothing they can act on. It names the consequence and then what to do
 * about it, because a notice that only states a condition leaves the reader with nowhere to
 * go. 122 characters, which is one line at 1280px and above.
 */
const SESSION_UNCONFIRMED_MESSAGE =
  'Could not confirm your session, so this page may be out of date. Reload it, or sign out and back in if that does not help.'

/**
 * Holds the session for the whole panel and keeps it honest.
 *
 * Three things happen here that are worth knowing. A stored token is a *claim*: it may have
 * been revoked while the tab was closed, so the session is `checking` until `/auth/me`
 * confirms it. Only a refusal ends a session — a backend that is unreachable says nothing
 * about whether the token is good, and signing the operator out over a network blip loses
 * their place for no reason. And `/auth/me`'s answer replaces the stored copy of the account,
 * because a name or role changed since sign-in would otherwise stay wrong in the sidebar for
 * as long as the session lasts.
 *
 * Keeping the session is not the same as saying nothing. A check that failed permanently
 * leaves the operator signed in against an account copy nobody has confirmed, and until
 * `F-013` that was completely silent.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(restoreSession)
  // A token in localStorage is a claim, not proof: it may have been revoked while the tab
  // was closed. Until `/auth/me` confirms it, the session is unverified rather than valid.
  const [checking, setChecking] = useState(() => auth.token !== null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [sessionCheckError, setSessionCheckError] = useState<string | null>(null)

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
    setSessionCheckError(null)
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

  const acknowledgeSessionCheckError = useCallback(() => setSessionCheckError(null), [])

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
      .then((session) => {
        // The stored user is a copy taken at sign-in. `/auth/me` has just reported the
        // current one, so take it: a name or role changed since then would otherwise stay
        // wrong in the sidebar for as long as the session lasts. Only replaced when the
        // response actually names someone — an empty answer is not a correction.
        const current = session.user
        if (cancelled || !current) return
        setAuth((previous) => {
          if (!previous.token) return previous
          storeSession(previous.token, current)
          return { token: previous.token, user: current }
        })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        // Only a refusal ends the session. A backend that is down or unreachable says
        // nothing about whether the token is still good, and signing the admin out over a
        // network blip would lose their place for no reason.
        if (error instanceof UnauthorizedError) {
          expireSession()
          return
        }
        // Everything else keeps the session and is reported instead — but only when it
        // cannot pass on its own. `transient` is the error hierarchy's own answer to that
        // question (ADR 0013), so a 500 and an unreachable host stay quiet while a `404`,
        // a `403` or an unreadable payload do not. Warning about a blip that heals itself
        // is how a warning that matters gets ignored.
        if (error instanceof ApiError && error.transient) return
        setSessionCheckError(SESSION_UNCONFIRMED_MESSAGE)
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
        sessionCheckError,
        acknowledgeSessionCheckError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
