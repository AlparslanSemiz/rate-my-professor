import type { BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'

export class LoginCodeService extends HttpService {
  /** Sends a one-time login code to the given email. */
  requestCode(email: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>('/auth/request-login', { email })
  }
}
