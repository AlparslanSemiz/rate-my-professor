import type { QueryParam } from './apiRequest'

/**
 * What a service is allowed to do with the network: send requests, and nothing else.
 *
 * `ApiClient` also owns the session — `setToken` and `setOnUnauthorized` — and handing the
 * whole client to nineteen services meant every one of them could revoke the operator's
 * session. `BugReportsService` has no business doing that, and nothing but the convention of
 * not calling those methods stopped it. Who holds the token is a decision that belongs to
 * `src/context`, so the services are handed this instead.
 */
export interface HttpTransport {
  /**
   * @param path the path below the base URL, starting with `/`
   * @param params query parameters; `undefined`, `null` and `''` are omitted from the string
   */
  get<T>(path: string, params?: Record<string, QueryParam>): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body?: unknown): Promise<T>
  delete<T>(path: string): Promise<T>
}
