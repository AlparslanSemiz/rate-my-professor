import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'

/**
 * How long a screen's data stays trusted before it is read again. Thirty seconds is chosen
 * against what the panel is for: an operator moves between screens while working a single
 * case — a report, then the profile behind it, then the audit entry it produced — and
 * re-reading the whole list on every one of those hops is noise, not freshness.
 */
const STALE_TIME_MS = 30_000

/**
 * A request the backend refused is not worth repeating. `401` ends the session,
 * `403` and `404` will refuse again, and `400` means the panel sent something wrong — none
 * of which a retry fixes, and each retry delays the message the operator needs to see.
 * Anything else (a network blip, a `500`, a `503`) is retried twice.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return failureCount < 2
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: shouldRetry,
        // The panel is a long-lived tab. Coming back to it should show the truth, not what
        // was true when the operator switched away.
        refetchOnWindowFocus: true,
      },
      // A write that failed, failed. Repeating it risks applying it twice.
      mutations: { retry: false },
    },
  })
}
