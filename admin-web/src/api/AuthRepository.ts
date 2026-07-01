export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
}

interface Credentials {
  id: number
  name: string
  email: string
  password: string
  role: string
}

const MOCK_USERS: Credentials[] = [
  { id: 1, name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'Admin' },
  { id: 2, name: 'Max Mustermann', email: 'max@example.com', password: 'max123', role: 'Developer' },
]

/** In-memory credential store, used when no backend is configured. */
export class AuthRepository {
  findByCredentials(email: string, password: string): AuthUser | undefined {
    const match = MOCK_USERS.find((u) => u.email === email && u.password === password)
    if (!match) return undefined

    return { id: match.id, name: match.name, email: match.email, role: match.role }
  }
}
