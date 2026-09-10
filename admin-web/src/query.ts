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
 * How many times a failure that could plausibly pass is retried before the operator is told.
 */
const MAX_QUERY_RETRIES = 2

/**
 * A request the backend refused is not worth repeating: an expired session, a refusal, a
 * missing record and a malformed request all fail again the same way, and each retry delays
 * the message the operator needs to see. Neither is a response the panel could not parse —
 * that used to arrive as `status: 0`, which this predicate read as "not a 4xx" and retried
 * twice for nothing.
 *
 * The judgement itself is not made here. Each error type answers `transient` for itself, so
 * adding a failure mode does not mean editing this function.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && !error.transient) return false
  return failureCount < MAX_QUERY_RETRIES
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
