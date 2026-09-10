import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

/**
 * A query client for one test.
 *
 * Three of the app's defaults are wrong for a test and are turned off here:
 *
 * - **`retry: false`.** The app retries a failed read twice. A test that asserts an error
 *   message would otherwise wait through those attempts before the message appeared, and
 *   would report as a timeout rather than as the failure it was checking.
 * - **`staleTime: 0`.** The app trusts data for thirty seconds. A test that changes
 *   something and expects the list to re-read needs the read to actually happen.
 * - **`refetchOnWindowFocus: false`.** jsdom fires focus events the test did not ask for.
 *
 * Each call returns a new client, so no test can see what another one cached.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  })
}

/** Wraps a page under test in its own client. Pass one in only to inspect the cache. */
export function withQueryClient(ui: ReactNode, client = createTestQueryClient()): ReactNode {
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>
}
