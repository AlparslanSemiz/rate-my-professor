import type { BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import { toAuthUser } from './authUserMapper'
import type { SessionPayload, SessionResponse } from './authTypes'

export class AuthSessionService extends HttpService {
  /** Revokes the current admin session. */
  logout(): Promise<BasicResponse> {
    return this.client.post<BasicResponse>('/auth/logout')
  }

  /**
   * Confirms the stored token is still accepted, so a session revoked while the tab was
   * closed is caught on load rather than on the first screen the admin happens to open.
   * Rejects with an `ApiError` of status 401 when the token is no longer valid.
   */
  async me(): Promise<SessionResponse> {
    const response = await this.client.get<SessionPayload>('/auth/me')
    return { ...response, user: toAuthUser(response.user) }
  }
}
