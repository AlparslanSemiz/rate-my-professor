export interface BasicResponse {
  message: string
  success: boolean
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type QueryMethod = 'POST' | 'PATCH'
type QueryParam = string | number | boolean | null | undefined

const DEFAULT_API_BASE_URL = 'http://localhost:8080'
/**
 * A rejected origin and an unreachable host are the same `TypeError` to `fetch` — the
 * browser refuses to say which — so the message has to name both rather than blame the
 * connection for what is usually a CORS allowlist.
 */
const NETWORK_ERROR_MESSAGE =
  'Could not reach the server. It may be down, or it may be refusing requests from this origin.'
export const EMPTY_RESPONSE_MESSAGE = 'The server returned an empty response.'
const INVALID_RESPONSE_MESSAGE = 'The server returned an invalid JSON response.'
const REFUSED_MESSAGE = 'The server refused the request.'

function hasErrorMessage(body: unknown): body is { message: string } {
  if (!body || typeof body !== 'object' || !('message' in body)) return false
  return typeof body.message === 'string' && body.message.trim().length > 0
}

/** A 2xx body that reports `success: false` — the request was served but refused. */
function isRefusal(body: unknown): boolean {
  if (!body || typeof body !== 'object' || !('success' in body)) return false
  return body.success === false
}

/**
 * Reads a list out of a response body. Without this the services call `.map` straight on a
 * field that may not be there, and the resulting `TypeError` surfaces to the operator as
 * though it were the backend's own explanation.
 */
export function expectArray<T>(body: unknown, key: string, context: string): T[] {
  const value = (body as Record<string, unknown> | null | undefined)?.[key]
  if (!Array.isArray(value)) {
    throw new ApiError(
      0,
      `${context} did not return a "${key}" list. The response did not match what this panel expects.`,
    )
  }
  return value as T[]
}

export class ApiClient {
  private readonly baseUrl: string
  private token: string | null = null
  private onUnauthorized: (() => void) | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string | null): void {
    this.token = token
  }

  /** Called when an authenticated request comes back 401, i.e. the session expired. */
  setOnUnauthorized(handler: (() => void) | null): void {
    this.onUnauthorized = handler
  }

  async get<T>(path: string, params?: Record<string, QueryParam>): Promise<T> {
    return this.request<T>(params ? this.withQueryString(path, params) : path, { method: 'GET' })
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
    return this.request<T>(this.withQueryString(path, params), { method })
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await this.fetchResponse(path, init)

    if (response.status === 401 && this.token) {
      this.onUnauthorized?.()
    }

    if (!response.ok) {
      throw new ApiError(response.status, await this.extractErrorMessage(response, path))
    }

    return this.parseSuccessResponse<T>(response)
  }

  private async fetchResponse(path: string, init: RequestInit): Promise<Response> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, { ...init, headers: this.headers(init) })
    } catch {
      throw new ApiError(0, NETWORK_ERROR_MESSAGE)
    }
    return response
  }

  private async parseSuccessResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) return undefined as T

    const text = await response.text()
    if (!text) {
      throw new ApiError(response.status, EMPTY_RESPONSE_MESSAGE)
    }

    let body: unknown
    try {
      body = JSON.parse(text)
    } catch {
      throw new ApiError(response.status, INVALID_RESPONSE_MESSAGE)
    }

    // Every response in this API carries `success`. A 2xx that reports `success: false` is a
    // refusal the operator has to be told about, not a write that quietly did nothing.
    if (isRefusal(body)) {
      throw new ApiError(
        response.status,
        hasErrorMessage(body) ? body.message : REFUSED_MESSAGE,
      )
    }

    return body as T
  }

  /** `Content-Type` is only true of a request that carries a body, so it is only sent then. */
  private headers(init: RequestInit): Record<string, string> {
    const headers: Record<string, string> = {}
    if (init.body !== undefined) headers['Content-Type'] = 'application/json'
    if (this.token) headers.Authorization = `Bearer ${this.token}`
    return headers
  }

  private withQueryString(path: string, params: Record<string, QueryParam>): string {
    const queryParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.set(key, String(value))
      }
    }
    const query = queryParams.toString()
    return query ? `${path}?${query}` : path
  }

  private async extractErrorMessage(response: Response, path: string): Promise<string> {
    try {
      const body: unknown = await response.json()
      if (hasErrorMessage(body)) return body.message
    } catch {
      // Body was not JSON; fall through to the generic message.
    }
    return `Request to ${path} failed with status ${response.status}`
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL)
