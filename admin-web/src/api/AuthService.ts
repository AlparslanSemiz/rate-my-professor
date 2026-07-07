import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

interface LoginResponse extends BasicResponse {
  authToken: string
}

export class AuthService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  /** Sends a one-time login code to the given email. */
  requestLoginCode(email: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>('/auth/request-login', { email })
  }

  /** Exchanges an email + one-time code for an auth token. */
  async login(email: string, loginToken: string): Promise<{ token: string }> {
    const response = await this.client.post<LoginResponse>('/auth/login', { email, loginToken })
    if (!response.success) throw new Error(response.message)
    return { token: response.authToken }
  }
}

export const authService = new AuthService(apiClient)
