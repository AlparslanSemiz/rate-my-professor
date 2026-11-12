import type { BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'

/** The first step of signing in: asking for a code. */
export class LoginCodeService extends HttpService {
  /**
   * Sends a one-time login code.
   *
   * The code itself never reaches the panel — it is emailed, hashed at rest and single-use —
   * so a success here means "sent", not "correct".
   *
   * @param email the address to send to
   * @returns the envelope, whose `message` is safe to show
   * @throws {RateLimitedError} three per address and twenty per IP, per quarter hour
   */
  requestCode(email: string): Promise<BasicResponse> {
    return this.client.post<BasicResponse>('/auth/request-login', { email })
  }
}
