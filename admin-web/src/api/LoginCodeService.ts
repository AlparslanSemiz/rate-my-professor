import type { ApiClient, BasicResponse } from './ApiClient'

export class LoginCodeService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  /** Sends a one-time login code to the given email. */
  requestCode(email: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>('/auth/request-login', { email })
  }
}
