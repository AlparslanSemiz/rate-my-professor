import { apiClient, type HttpTransport, type BasicResponse } from '@/api/client/ApiClient'
import { AuthSessionService } from './AuthSessionService'
import { LoginCodeService } from './LoginCodeService'
import { TokenLoginService } from './TokenLoginService'
import { toAuthUser } from './authUserMapper'
import type { SessionResponse } from './authTypes'

export { toAuthUser }
export type {
  AuthUser,
  LoginResponse,
  SessionPayload,
  SessionResponse,
  SessionUserPayload,
} from './authTypes'

/**
 * Everything the panel does about who is signed in, as one surface.
 *
 * Sign-in is three separate exchanges with the backend — ask for a code, trade the code for a
 * token, then find out who that token belongs to — and each is its own service so that a
 * change to one is not a change to the others. This composes them, because the caller only
 * ever wants "sign in", not three round trips it has to sequence itself.
 */
export class AuthService {
  private readonly loginCodes: LoginCodeService
  private readonly tokenLogin: TokenLoginService
  private readonly session: AuthSessionService

  constructor(client: HttpTransport) {
    this.loginCodes = new LoginCodeService(client)
    this.tokenLogin = new TokenLoginService(client)
    this.session = new AuthSessionService(client)
  }

  /**
   * Asks the backend to email a one-time code.
   *
   * @param email the address to send to; the backend refuses one with no admin account
   * @returns the envelope, whose `message` is safe to show
   * @throws {RateLimitedError} the cap is three codes per address per quarter hour, so this
   *         is reachable in ordinary use — two failed attempts before a demo will hit it
   * @throws {ForbiddenError} when the address has no admin account
   */
  requestLoginCode(email: string): Promise<BasicResponse> {
    return this.loginCodes.requestCode(email)
  }

  /**
   * Trades an emailed code for a session token. Does not install it — see `authenticateAdmin`,
   * which owns what happens to a token once it exists.
   *
   * @param email the address the code was sent to
   * @param loginToken the six-character code from that email; single-use, five-minute life
   * @returns the bearer token for the new session
   * @throws {ContractError} when the backend accepted the login and named no token
   * @throws {ResponseError} when the code is wrong, used or expired
   */
  async login(email: string, loginToken: string): Promise<{ token: string }> {
    return this.tokenLogin.login(email, loginToken)
  }

  /**
   * Revokes the session at the backend.
   *
   * Failing is survivable and the caller is expected to sign out locally anyway: a token the
   * backend still holds is worse than one it does not, but leaving the operator signed in
   * because the network was down is worse than both.
   *
   * @returns the envelope
   */
  logout(): Promise<BasicResponse> {
    return this.session.logout()
  }

  /**
   * Who the current token belongs to, according to the backend.
   *
   * The only source of an admin's identity. The id here is the one that appears as the actor
   * on audit entries, and the panel has no other way to learn an id the backend issued —
   * inventing one once put a fabricated author on a warning.
   *
   * @returns the session envelope; `user` is absent when the payload named no usable id
   * @throws {UnauthorizedError} when the token is no longer accepted
   */
  async me(): Promise<SessionResponse> {
    return this.session.me()
  }
}

/** The panel's auth service, bound to the shared client and therefore the shared session. */
export const authService = new AuthService(apiClient)
