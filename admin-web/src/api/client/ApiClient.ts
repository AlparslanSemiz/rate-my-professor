import { ApiRequestBuilder, ApiSession, type QueryMethod, type QueryParam } from './apiRequest'
import { ApiError, ApiResponseParser } from './apiResponse'

export {
  ApiError,
  EMPTY_RESPONSE_MESSAGE,
  expectArray,
  type BasicResponse,
} from './apiResponse'
export type { QueryMethod, QueryParam } from './apiRequest'

const DEFAULT_API_BASE_URL = 'http://localhost:8080'
/**
 * A rejected origin and an unreachable host are the same `TypeError` to `fetch` — the
 * browser refuses to say which — so the message has to name both rather than blame the
 * connection for what is usually a CORS allowlist.
 */
const NETWORK_ERROR_MESSAGE =
  'Could not reach the server. It may be down, or it may be refusing requests from this origin.'

export class ApiClient {
  private readonly session = new ApiSession()
  private readonly requestBuilder: ApiRequestBuilder
  private readonly responseParser = new ApiResponseParser()

  constructor(baseUrl: string) {
    this.requestBuilder = new ApiRequestBuilder(baseUrl, this.session)
  }

  setToken(token: string | null): void {
    this.session.setToken(token)
  }

  /** Called when an authenticated request comes back 401, i.e. the session expired. */
  setOnUnauthorized(handler: (() => void) | null): void {
    this.session.setOnUnauthorized(handler)
  }

  async get<T>(path: string, params?: Record<string, QueryParam>): Promise<T> {
    return this.request<T>(
      params ? this.requestBuilder.withQueryString(path, params) : path,
      { method: 'GET' },
    )
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' })
  }

  /**
   * Sends `params` as a query string with no body, matching backend endpoints whose
   * parameters aren't annotated with @RequestBody and so are bound from the query string.
   */
  async withQueryParams<T>(method: QueryMethod, path: string, params: Record<string, string>): Promise<T> {
    return this.request<T>(this.requestBuilder.withQueryString(path, params), { method })
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
    } catch {
      throw new ApiError(0, NETWORK_ERROR_MESSAGE)
    }
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL)
