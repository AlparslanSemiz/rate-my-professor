import { useState, type ReactNode } from 'react'
import { AuthContext, type User } from './AuthContextValue'

interface AuthState {
  token: string | null
  user: User | null
}

const emptyAuthState: AuthState = { token: null, user: null }

function clearStoredAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

function loadStoredAuth(): AuthState {
  const token = localStorage.getItem('token')
  const stored = localStorage.getItem('user')
  if (!token && !stored) return emptyAuthState
  if (!token || !stored) {
    clearStoredAuth()
    return emptyAuthState
  }

  try {
    return { token, user: JSON.parse(stored) as User }
  } catch {
    clearStoredAuth()
    return emptyAuthState
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadStoredAuth)

  function login(newToken: string, newUser: User) {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setAuth({ token: newToken, user: newUser })
  }

  function logout() {
    clearStoredAuth()
    setAuth(emptyAuthState)
  }

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
