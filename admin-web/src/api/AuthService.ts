import { apiClient, type ApiClient } from './ApiClient'
import { RemoteBackedService, delay } from './RemoteBackedService'
import { AuthRepository, type AuthUser } from './AuthRepository'

export interface LoginResponse {
  token: string
  user: AuthUser
}

export class AuthService extends RemoteBackedService {
  private readonly repository = new AuthRepository()

  constructor(client: ApiClient) {
    super(client)
  }

  login(email: string, password: string): Promise<LoginResponse> {
    return this.execute(
      () => this.client.post<LoginResponse>('/auth/login', { email, password }),
      async () => {
        await delay(600)
        const user = this.repository.findByCredentials(email, password)
        if (!user) throw new Error('Invalid email or password')
        return { token: `mock-token-${user.id}`, user }
      }
    )
  }
}

export const authService = new AuthService(apiClient)
