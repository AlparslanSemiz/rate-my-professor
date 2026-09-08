import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
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

export class AuthService {
  private readonly loginCodes: LoginCodeService
  private readonly tokenLogin: TokenLoginService
  private readonly session: AuthSessionService

  constructor(client: ApiClient) {
    this.loginCodes = new LoginCodeService(client)
    this.tokenLogin = new TokenLoginService(client)
    this.session = new AuthSessionService(client)
  }

  requestLoginCode(email: string): Promise<BasicResponse> {
    return this.loginCodes.requestCode(email)
  }

  async login(email: string, loginToken: string): Promise<{ token: string }> {
    return this.tokenLogin.login(email, loginToken)
  }

  logout(): Promise<BasicResponse> {
    return this.session.logout()
  }

  async me(): Promise<SessionResponse> {
    return this.session.me()
  }
}

export const authService = new AuthService(apiClient)
