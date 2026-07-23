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
const NETWORK_ERROR_MESSAGE = 'Could not reach the server. Check your connection and try again.'
export const EMPTY_RESPONSE_MESSAGE = 'The server returned an empty response.'
const INVALID_RESPONSE_MESSAGE = 'The server returned an invalid JSON response.'

function hasErrorMessage(body: unknown): body is { message: string } {
  if (!body || typeof body !== 'object' || !('message' in body)) return false
  return typeof body.message === 'string' && body.message.trim().length > 0
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
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, { ...init, headers: this.headers() })
    } catch {
      throw new ApiError(0, NETWORK_ERROR_MESSAGE)
    }

    if (response.status === 401 && this.token) {
      this.onUnauthorized?.()
    }

    if (!response.ok) {
      throw new ApiError(response.status, await this.extractErrorMessage(response, path))
    }

    if (response.status === 204) return undefined as T

    const text = await response.text()
    if (!text) {
      throw new ApiError(response.status, EMPTY_RESPONSE_MESSAGE)
    }

    try {
      return JSON.parse(text) as T
    } catch {
      throw new ApiError(response.status, INVALID_RESPONSE_MESSAGE)
    }
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
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
