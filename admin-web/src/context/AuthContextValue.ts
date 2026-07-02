import { createContext } from 'react'
import type { AuthUser } from '../api/AuthService'

export type { AuthUser }

export interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)
