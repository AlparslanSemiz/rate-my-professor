const DEFAULT_API_BASE_URL = 'http://localhost:8080'

/**
 * The base the panel actually calls, read from the same variable `ApiClient` reads.
 *
 * Not hard-coded: a handler registered against the wrong base matches nothing, and MSW's
 * failure mode for that is an unhandled request rather than an obviously wrong URL. Deriving
 * it means the handlers cannot drift from the client.
 */
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL

/**
 * @param path a path below the API base, starting with `/`
 * @returns the pattern a handler should be registered against
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}
