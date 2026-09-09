export type QueryMethod = 'POST' | 'PATCH'
export type QueryParam = string | number | boolean | null | undefined

export class ApiSession {
  private token: string | null = null
  private onUnauthorized: (() => void) | null = null

  setToken(token: string | null): void {
    this.token = token
  }

  setOnUnauthorized(handler: (() => void) | null): void {
    this.onUnauthorized = handler
  }

  hasToken(): boolean {
    return this.token !== null
  }

  notifyUnauthorized(): void {
    this.onUnauthorized?.()
  }

  authorizationHeader(): string | null {
    return this.token ? `Bearer ${this.token}` : null
  }
}

export class ApiRequestBuilder {
  private readonly baseUrl: string
  private readonly session: ApiSession

  constructor(baseUrl: string, session: ApiSession) {
    this.baseUrl = baseUrl
    this.session = session
  }

  url(path: string): string {
    return `${this.baseUrl}${path}`
  }

  withQueryString(path: string, params: Record<string, QueryParam>): string {
    const queryParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.set(key, String(value))
      }
    }
    const query = queryParams.toString()
    return query ? `${path}?${query}` : path
  }

  init(init: RequestInit): RequestInit {
    return { ...init, headers: this.headers(init) }
  }

  private headers(init: RequestInit): Record<string, string> {
    const headers: Record<string, string> = {}
    if (init.body !== undefined) headers['Content-Type'] = 'application/json'

    const authorization = this.session.authorizationHeader()
    if (authorization) headers.Authorization = authorization

    return headers
  }
}
