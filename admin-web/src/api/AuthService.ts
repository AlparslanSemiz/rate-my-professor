import { apiClient, ApiError, type ApiClient, type BasicResponse } from './ApiClient'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

interface LoginResponse extends BasicResponse {
  authToken: string
}

/** What `/auth/me` reports about the token currently held. */
export interface SessionResponse extends BasicResponse {
  user?: AuthUser
}

const MISSING_TOKEN_MESSAGE = 'The server accepted the login but returned no token.'

export class AuthService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  /** Sends a one-time login code to the given email. */
  requestLoginCode(email: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>('/auth/request-login', { email })
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

  /** Revokes the current admin session. */
  logout(): Promise<BasicResponse> {
    return this.client.post<BasicResponse>('/auth/logout')
  }

  /**
   * Confirms the stored token is still accepted, so a session revoked while the tab was
   * closed is caught on load rather than on the first screen the admin happens to open.
   * Rejects with an `ApiError` of status 401 when the token is no longer valid.
   */
  me(): Promise<SessionResponse> {
    return this.client.get<SessionResponse>('/auth/me')
  }
}

export const authService = new AuthService(apiClient)
