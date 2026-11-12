/**
 * What may be sent as a query-string value. `null` and `undefined` are permitted so callers
 * can pass an absent filter straight through instead of building the object conditionally —
 * `withQueryString` drops them.
 */
export type QueryParam = string | number | boolean | null | undefined

/**
 * The bearer token and what to do when the backend stops accepting it.
 *
 * Separate from request building so that "who is signed in" is held in one object rather than
 * spread across the client. Only `ApiClient` holds one; services are handed `HttpTransport`,
 * which cannot reach it.
 */
export class ApiSession {
  private token: string | null = null
  private onUnauthorized: (() => void) | null = null

  /**
   * @param token the bearer token to send from now on, or `null` to send none
   */
  setToken(token: string | null): void {
    this.token = token
  }

  /**
   * @param handler called once per `401` on an authenticated request, or `null` to stop
   *        listening — the provider passes `null` when it unmounts
   */
  setOnUnauthorized(handler: (() => void) | null): void {
    this.onUnauthorized = handler
  }

  /**
   * @returns whether a token is set. A `401` without one is an anonymous request being
   *          refused, not a session ending, so it must not sign anybody out.
   */
  hasToken(): boolean {
    return this.token !== null
  }

  /** Tells the listener the session is over. Does nothing when nobody is listening. */
  notifyUnauthorized(): void {
    this.onUnauthorized?.()
  }

  /** @returns the `Authorization` value to send, or `null` when there is no session. */
  authorizationHeader(): string | null {
    return this.token ? `Bearer ${this.token}` : null
  }
}

/**
 * Turns a path and a body into the URL and headers `fetch` is called with.
 *
 * Knows the base URL and reads the session for its header, and nothing else. Keeping it apart
 * from `ApiResponseParser` means the request and the response are two things that can be
 * tested and changed separately.
 */
export class ApiRequestBuilder {
  private readonly baseUrl: string
  private readonly session: ApiSession

  constructor(baseUrl: string, session: ApiSession) {
    this.baseUrl = baseUrl
    this.session = session
  }

  /** @param path a path below the base URL, starting with `/` */
  url(path: string): string {
    return `${this.baseUrl}${path}`
  }

  /**
   * Appends the parameters that carry a value.
   *
   * `undefined`, `null` **and the empty string** are all dropped. The empty string matters:
   * it is what an untouched search box holds, and sending `q=` asks the backend to filter for
   * nothing rather than to filter not at all.
   *
   * @param path the path to append to
   * @param params the parameters; absent ones are omitted rather than sent empty
   * @returns the path with a query string, or unchanged when nothing survived
   */
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

  /**
   * @param init the caller's request options
   * @returns the same options with `Content-Type` and `Authorization` filled in as needed
   */
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
