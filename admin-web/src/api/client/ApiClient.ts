import { ApiRequestBuilder, ApiSession, type QueryParam } from './apiRequest'
import type { HttpTransport } from './httpTransport'
import { NetworkError } from './apiErrors'
import { ApiResponseParser } from './apiResponse'

export {
  ApiError,
  BadRequestError,
  ConflictError,
  ContractError,
  ForbiddenError,
  HTTP_STATUS,
  NetworkError,
  NotFoundError,
  RateLimitedError,
  RefusedError,
  ResponseError,
  UnauthorizedError,
} from './apiErrors'
export {
  EMPTY_RESPONSE_MESSAGE,
  expectArray,
  type BasicResponse,
} from './apiResponse'
export type { QueryParam } from './apiRequest'
export type { HttpTransport } from './httpTransport'

const DEFAULT_API_BASE_URL = 'http://localhost:8080'
/**
 * A rejected origin and an unreachable host are the same `TypeError` to `fetch` — the
 * browser refuses to say which — so the message has to name both rather than blame the
 * connection for what is usually a CORS allowlist.
 */
const NETWORK_ERROR_MESSAGE =
  'Could not reach the server. It may be down, or it may be refusing requests from this origin.'

/**
 * The one object that talks to the backend.
 *
 * It composes three collaborators, each owning one decision: `ApiSession` holds the token and
 * the expiry listener, `ApiRequestBuilder` builds the URL and headers, `ApiResponseParser`
 * turns the answer into a payload or a typed failure. The client itself only sequences them
 * and reports a `401` to whoever is listening.
 *
 * Services never receive this. They are given `HttpTransport`, which is the four verbs and
 * nothing else — see `./httpTransport`.
 */
export class ApiClient implements HttpTransport {
  private readonly session = new ApiSession()
  private readonly requestBuilder: ApiRequestBuilder
  private readonly responseParser = new ApiResponseParser()

  constructor(baseUrl: string) {
    this.requestBuilder = new ApiRequestBuilder(baseUrl, this.session)
  }

  /**
   * Authorises every later request, or stops doing so.
   *
   * @param token the bearer token, or `null` to send requests unauthenticated
   */
  setToken(token: string | null): void {
    this.session.setToken(token)
  }

  /** Called when an authenticated request comes back 401, i.e. the session expired. */
  setOnUnauthorized(handler: (() => void) | null): void {
    this.session.setOnUnauthorized(handler)
  }

  /**
   * @param path a path below the base URL, starting with `/`
   * @param params query parameters; absent ones are omitted rather than sent empty
   * @returns the parsed body
   * @throws {ApiError} one of the typed failures in `./apiErrors`
   */
  async get<T>(path: string, params?: Record<string, QueryParam>): Promise<T> {
    return this.request<T>(
      params ? this.requestBuilder.withQueryString(path, params) : path,
      { method: 'GET' },
    )
  }

  /**
   * @param path a path below the base URL, starting with `/`
   * @param body serialised as JSON; omit it for an endpoint that takes none
   * @returns the parsed body
   * @throws {ApiError} one of the typed failures in `./apiErrors`
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  }

  /**
   * @param path a path below the base URL, starting with `/`
   * @param body the fields to change; the backend leaves omitted fields alone
   * @returns the parsed body
   * @throws {ApiError} one of the typed failures in `./apiErrors`
   */
  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
  }

  /**
   * @param path a path below the base URL, starting with `/`
   * @returns the parsed body, or `undefined` for the endpoints that answer `204`
   * @throws {ApiError} one of the typed failures in `./apiErrors`
   */
  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await this.fetchResponse(path, init)

    if (response.status === 401 && this.session.hasToken()) {
      this.session.notifyUnauthorized()
    }

    return this.responseParser.parse<T>(response, path)
  }

  private async fetchResponse(path: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(this.requestBuilder.url(path), this.requestBuilder.init(init))
    } catch (cause: unknown) {
      throw new NetworkError(NETWORK_ERROR_MESSAGE, cause)
    }
  }
}

/**
 * The panel's single client, and therefore its single session.
 *
 * One instance rather than one per service, because the token is shared: signing in has to
 * authorise every later request, whichever service makes it.
 */
export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL)
