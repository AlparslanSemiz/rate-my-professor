import { apiClient, ApiError, type ApiClient, type BasicResponse } from './ApiClient'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  /**
   * Whether this account may also moderate other admin accounts. The backend is the authority:
   * it answers `false` for students and ordinary admins, and it is what actually authorizes the
   * request. Optional because a session stored before the backend reported it carries no flag.
   */
  isSuperAdmin?: boolean
}

/**
 * The user as `/auth/me` puts it on the wire. The backend names these fields `username` and
 * `kitEmail`, as it does on `/users`; the older `name` / `email` spelling is still accepted so
 * the panel does not depend on which one this endpoint happens to use. Everything is optional
 * because none of it is promised — the response is not validated by the client.
 */
interface SessionUserPayload {
  id?: unknown
  username?: unknown
  name?: unknown
  kitEmail?: unknown
  email?: unknown
  role?: unknown
  isSuperAdmin?: unknown
}

interface LoginResponse extends BasicResponse {
  authToken: string
}

/** `/auth/me` before the payload is mapped onto the panel's own `AuthUser`. */
interface SessionPayload extends BasicResponse {
  user?: SessionUserPayload
}

/** What `/auth/me` reports about the token currently held. */
export interface SessionResponse extends BasicResponse {
  user?: AuthUser
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/**
 * The panel's `AuthUser` from whatever `/auth/me` reported, or nothing when the response named
 * no usable account. The id decides: it is the value that appears as the actor on audit
 * entries, and an id the backend did not issue must never be sent back to it.
 */
export function toAuthUser(payload: SessionUserPayload | undefined): AuthUser | undefined {
  if (!payload) return undefined

  const id = readString(payload.id).trim()
  if (!id) return undefined

  return {
    id,
    name: readString(payload.username) || readString(payload.name),
    email: readString(payload.kitEmail) || readString(payload.email),
    role: readString(payload.role),
    isSuperAdmin: payload.isSuperAdmin === true,
  }
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
   *
   * The payload is mapped here so every caller sees the panel's own `AuthUser` rather than
   * whichever field names the backend used. A confirmed token that names nobody is not an
   * error: the login path falls back to finding the identity elsewhere.
   */
  async me(): Promise<SessionResponse> {
    const response = await this.client.get<SessionPayload>('/auth/me')
    return { ...response, user: toAuthUser(response.user) }
  }
}

export const authService = new AuthService(apiClient)
