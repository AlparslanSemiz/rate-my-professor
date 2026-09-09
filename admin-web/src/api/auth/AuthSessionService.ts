import type { BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import { toAuthUser } from './authUserMapper'
import type { SessionPayload, SessionResponse } from './authTypes'

/** The session as the backend sees it: whether it is still valid, and ending it. */
export class AuthSessionService extends HttpService {
  /**
   * Revokes the current admin session at the backend.
   *
   * @returns the envelope
   */
  logout(): Promise<BasicResponse> {
    return this.client.post<BasicResponse>('/auth/logout')
  }

  /**
   * Confirms the stored token is still accepted, so a session revoked while the tab was
   * closed is caught on load rather than on the first screen the admin happens to open.
   *
   * @returns the session envelope, with `user` mapped to the panel's own shape
   * @throws {UnauthorizedError} when the token is no longer valid — the one failure that
   *         ends the session; every other failure leaves it alone
   */
  async me(): Promise<SessionResponse> {
    const response = await this.client.get<SessionPayload>('/auth/me')
    return { ...response, user: toAuthUser(response.user) }
  }
}
