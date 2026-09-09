import { createContext } from 'react'
import type { AuthUser } from '@/api/auth'

export type { AuthUser }

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
}

export const AuthContext = createContext<AuthContextType | null>(null)
