import { http } from 'msw'
import { setupWorker } from 'msw/browser'
import { apiUrl } from './apiUrl'
import { seedDb } from './db'
import { DEMO_ADMIN, demoBackend } from './demoData'
import { failure } from './envelope'
import { handlers } from './handlers'
import { setSessionUser } from './handlers/auth'

/**
 * Failures the panel can be asked to render, by adding `?fault=<name>` to any URL.
 *
 * `docs/DESIGN.md` says a style change is not finished until it has been looked at, and the
 * states most worth looking at are the ones nothing reaches by clicking: an alert region has
 * to be seen while it is *showing*. Without this, checking one meant editing a handler,
 * screenshotting, and editing it back — which is how a state gets signed off unseen.
 *
 * Test-only. This module is imported behind a compile-time constant and is absent from a
 * production build, along with the rest of the mock backend.
 */
const FAULTS: Record<string, () => ReturnType<typeof http.get>> = {
  /** The legacy `/auth/me` gone — the session notice this exists to show (`F-013`). */
  'session-check': () => http.get(apiUrl('/auth/me'), () => failure(404, 'No handler for GET /auth/me')),
  /** A counter read failing while the rest of the dashboard arrives — a page-level error. */
  'system-status': () =>
    http.get(apiUrl('/system/status'), () => failure(500, 'Counters are unavailable.')),
  /**
   * A refused *filter* on the users table. Deliberately only when `q` is present: the table has
   * to load once before `tableError` can render at all, so a handler that always failed would
   * show the whole-page `LoadError` instead and never reach the state being looked at.
   */
  'users-filter': () =>
    http.get(apiUrl('/users'), ({ request }) =>
      new URL(request.url).searchParams.get('q')
        ? failure(400, 'Invalid user status')
        : undefined,
    ),
}

/**
 * @returns the overrides named by `?fault=a,b`, ignoring any name that is not a known fault
 */
function requestedFaults(): ReturnType<typeof http.get>[] {
  const requested = new URLSearchParams(window.location.search).get('fault')
  if (!requested) return []
  return requested
    .split(',')
    .map((name) => FAULTS[name.trim()])
    .filter((fault) => fault !== undefined)
    .map((fault) => fault())
}

/**
 * The same handlers, in a real browser, for the end-to-end layer.
 *
 * The E2E specs run against **no backend at all**. That is deliberate: they exist to prove
 * the panel's own flows — sign in, moderate, triage, undo — and pinning them to a deployed
 * backend would make them fail for reasons that have nothing to do with the panel, at the one
 * moment they are being demonstrated.
 *
 * Loaded only when `VITE_MOCK_BACKEND` is set. Nothing here reaches a production build: the
 * import in `src/main.tsx` is behind a compile-time constant that Vite folds away.
 */
export async function startBrowserMockBackend(): Promise<void> {
  seedDb(demoBackend())
  // Reported once a token exists. Nothing calls `/auth/me` before sign-in.
  setSessionUser({ ...DEMO_ADMIN.session })

  // Faults first: MSW resolves in order and the first match wins.
  const worker = setupWorker(...requestedFaults(), ...handlers)
  await worker.start({
    // The panel legitimately asks for its own assets and Vite's client; only API calls are
    // this worker's business.
    onUnhandledRequest: 'bypass',
    quiet: true,
  })
}
