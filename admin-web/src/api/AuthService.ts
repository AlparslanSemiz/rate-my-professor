import { apiClient, delay, type ApiClient } from './ApiClient'

const MOCK_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'Admin' },
  { id: 2, name: 'Max Mustermann', email: 'max@example.com', password: 'max123', role: 'Developer' },
]

export interface LoginResponse {
  token: string
  user: {
    id: number
    name: string
    email: string
    role: string
  }
}

export class AuthService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    if (this.client.isConfigured) {
      return this.client.post<LoginResponse>('/auth/login', { email, password })
    }

    await delay(600)
    const match = MOCK_USERS.find((u) => u.email === email && u.password === password)
    if (!match) throw new Error('Invalid email or password')

    const user = {
      id: match.id,
      name: match.name,
      email: match.email,
      role: match.role,
    }

    return { token: `mock-token-${user.id}`, user }
  }
}

export const authService = new AuthService(apiClient)
