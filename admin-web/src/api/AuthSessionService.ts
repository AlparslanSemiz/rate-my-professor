import type { ApiClient, BasicResponse } from './ApiClient'
import { toAuthUser } from './authUserMapper'
import type { SessionPayload, SessionResponse } from './authTypes'

export class AuthSessionService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  logout(): Promise<BasicResponse> {
    return this.client.post<BasicResponse>('/auth/logout')
  }

  async me(): Promise<SessionResponse> {
    const response = await this.client.get<SessionPayload>('/auth/me')
    return { ...response, user: toAuthUser(response.user) }
  }
}
