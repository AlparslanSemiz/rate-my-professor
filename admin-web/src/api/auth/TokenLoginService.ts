import { ContractError } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { LoginResponse } from './authTypes'

const MISSING_TOKEN_MESSAGE = 'The server accepted the login but returned no token.'

/** The second step of signing in: turning an emailed code into a token. */
export class TokenLoginService extends HttpService {
  /**
   * Exchanges an email + one-time code for an auth token.
   *
   * A refusal is already a typed error by the time it gets here — the client rejects anything
   * reporting `success: false` — so the only case left to guard is a success that carried no
   * token, which is a contract violation rather than a refusal.
   *
   * @param email the address the code was sent to
   * @param loginToken the one-time code from that email
   * @returns the bearer token for the new session
   * @throws {ContractError} when the backend accepted the login but named no token
   * @throws {ResponseError} when the backend refused the credentials
   */
  async login(email: string, loginToken: string): Promise<{ token: string }> {
    const response = await this.client.post<LoginResponse>('/auth/login', { email, loginToken })
    if (typeof response.authToken !== 'string' || !response.authToken.trim()) {
      throw new ContractError(MISSING_TOKEN_MESSAGE)
    }
    return { token: response.authToken }
  }
}
