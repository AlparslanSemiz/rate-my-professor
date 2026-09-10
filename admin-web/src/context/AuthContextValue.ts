import { createContext } from 'react'
import type { AuthUser } from '@/api/auth'

export type { AuthUser }

/**
 * The session, and the things that change it.
 *
 * `checking`, `sessionExpired` and `sessionCheckError` are three separate states, not two,
 * because the panel owes the operator a different answer for each. "We do not know yet" shows
 * a loader; "the backend refused" shows the login page with a reason; "the backend answered,
 * but not usefully" leaves the operator working and tells them what they are looking at may
 * be stale. Collapsing the first two showed an expiry notice on every cold load; the third was
 * missing entirely, which is `F-013`.
 */
export interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (token: string, user: AuthUser) => void
  logout: () => Promise<void>
  isAuthenticated: boolean
  /** True while a stored token is still being confirmed with the backend on load. */
  checking: boolean
  /** True when the session ended because the backend rejected the token, not by signing out. */
  sessionExpired: boolean
  /** Drops the expiry notice once it has been shown. */
  acknowledgeExpiry: () => void
  /**
   * Why the stored session could not be confirmed, when that failure did **not** end it, or
   * `null` when there is nothing to say. The session is still usable; the account shown is a
   * copy nothing has checked.
   */
  sessionCheckError: string | null
  /** Drops the unconfirmed-session notice once it has been shown. */
  acknowledgeSessionCheckError: () => void
}

/**
 * `null` until a provider supplies a value, which `useAuth` asserts against — a component
 * outside the provider is a wiring mistake, not something an operator can cause.
 */
export const AuthContext = createContext<AuthContextType | null>(null)
