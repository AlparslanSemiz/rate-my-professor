import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { resetDb } from './db'
import { handlers } from './handlers'
import { resetSession } from './handlers/auth'
import { clearRequests, recordRequests } from './requests'

/**
 * The request layer for the tests that have been migrated off `vi.mock`.
 *
 * Started per file rather than in `src/test/setup.ts`, because `onUnhandledRequest: 'error'`
 * is the point of it and the files that still replace their service module legitimately make
 * no requests at all — a global server would fail every one of them on a request that never
 * happens. ADR 0009 records the slice-by-slice rule; this is what enforces it.
 */
export const server = setupServer(...handlers)

/**
 * Wires the server into one test file's lifecycle, and resets the store between tests.
 *
 * Call it at the top level of a migrated test file. Deliberately not named `use…`: it is not
 * a React hook, and the prefix made both ESLint and a reader think it was. `onUnhandledRequest: 'error'` is not
 * optional here: the reason to move off `vi.mock` is to find out what the screen actually
 * sends, and a request nobody handled is exactly that information.
 */
export function startMockBackend(): void {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
    recordRequests(server)
  })
  afterEach(() => {
    server.resetHandlers()
    resetDb()
    resetSession()
    clearRequests()
  })
  afterAll(() => server.close())
}
