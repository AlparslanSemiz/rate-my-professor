import { ApiError, type ApiClient } from './ApiClient'
import type { LoginResponse } from './authTypes'

const MISSING_TOKEN_MESSAGE = 'The server accepted the login but returned no token.'

export class TokenLoginService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  /**
   * Exchanges an email + one-time code for an auth token. A refusal is already an `ApiError`
   * by the time it gets here — the client rejects anything reporting `success: false` — so
   * the only case left to guard is a success that carried no token.
   */
  async login(email: string, loginToken: string): Promise<{ token: string }> {
    const response = await this.client.post<LoginResponse>('/auth/login', { email, loginToken })
    if (typeof response.authToken !== 'string' || !response.authToken.trim()) {
      throw new ApiError(0, MISSING_TOKEN_MESSAGE)
    }
    return { token: response.authToken }
  }
}
