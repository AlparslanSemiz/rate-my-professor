import { http, type HttpHandler } from 'msw'
import { setupWorker } from 'msw/browser'
import { apiUrl } from './apiUrl'
import { seedDb } from './db'
import { DEMO_ADMIN, demoBackend } from './demoData'
import { db } from './db'
import { failure, ok } from './envelope'
import { handlers } from './handlers'
import { setSessionUser } from './handlers/auth'
import { without } from './wire'

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
/**
 * The longest thing a column can be asked to hold.
 *
 * Real German course prose rather than a repeated character, because a run of `x` wraps
 * differently from a word and it is wrapping that breaks a layout.
 */
const LONG_TEXT =
  'Die Vorlesung Grundlagen der Programmierung mit begleitendem Tutorium und Rechnerübung ' +
  'behandelt Datenstrukturen, Algorithmen und Softwaretechnik im Wintersemester und wird ' +
  'gemeinsam von mehreren Lehrstühlen des KIT angeboten, weshalb die Beschreibung so lang ist.'
const LONG_NAME = 'Maximiliane Charlotte von Brandenburger-Hohenzollern'

const FAULTS: Record<string, () => HttpHandler[]> = {
  /** The legacy `/auth/me` gone — the session notice this exists to show (`F-013`). */
  'session-check': () => [http.get(apiUrl('/auth/me'), () => failure(404, 'No handler for GET /auth/me'))],
  /** A counter read failing while the rest of the dashboard arrives — a page-level error. */
  'system-status': () => [
    http.get(apiUrl('/system/status'), () => failure(500, 'Counters are unavailable.')),
  ],
  /**
   * A refused *filter* on the users table. Deliberately only when `q` is present: the table has
   * to load once before `tableError` can render at all, so a handler that always failed would
   * show the whole-page `LoadError` instead and never reach the state being looked at.
   */
  'users-filter': () => [
    http.get(apiUrl('/users'), ({ request }) =>
      new URL(request.url).searchParams.get('q')
        ? failure(400, 'Invalid user status')
        : undefined,
    ),
  ],
  /**
   * The longest content every column can be handed at once.
   *
   * A layout breaks on its worst case, and the worst case is not in the demo data — that is
   * chosen to look like a real backend at the Abnahme. Measuring against it would report the
   * width of the fixture rather than the width of the column.
   */
  'long-content': () => [
    http.get(apiUrl('/users'), () =>
      ok({
        users: db.users.map((user) => ({ ...user, username: LONG_NAME, biography: LONG_TEXT })),
        nextCursor: null,
      }),
    ),
    http.get(apiUrl('/comments'), () =>
      ok({
        comments: db.comments.map((comment) => ({
          ...comment,
          content: LONG_TEXT,
          postContext: LONG_TEXT.slice(0, 90),
          author: { ...comment.author, name: LONG_NAME },
        })),
      }),
    ),
    // `/data/lectures/all`, not `/data/lectures`: the catalogue moved to the admin read when
    // the activity filter landed, and this override kept patching a path the panel no longer
    // requests - so `?fault=long-content` silently stopped reaching the catalogue while still
    // reaching Comments, and the screen it was written for came back with ordinary names.
    http.get(apiUrl('/data/lectures/all'), () =>
      ok({
        lectures: db.lectures.map((lecture) => ({ ...lecture, name: LONG_TEXT.slice(0, 120) })),
      }),
    ),
  ],
  /**
   * The backend refusing a block.
   *
   * `409` is the status it answers when the target may not be moderated by this operator — an
   * administrator account, or the operator's own. The panel hides those controls itself, so the
   * refusal is unreachable by clicking; this makes it reachable, which is the only way to see
   * what the operator is actually told when the two disagree.
   */
  'block-refused': () => [
    http.patch(apiUrl('/users/:id/block'), () =>
      failure(409, 'Administrator accounts cannot be blocked.'),
    ),
  ],
  /**
   * A log's filter vocabulary failing while its entries arrive.
   *
   * The two log screens read `/…/meta` and `/…` as separate queries, and only the second one
   * has rows to show. What an operator gets when the vocabulary is missing — dropdowns with no
   * options above a table that works — is a state nothing reaches by clicking.
   */
  'log-meta': () => [
    http.get(apiUrl('/activity-logs/meta'), () => failure(500, 'Filter vocabulary unavailable.')),
    http.get(apiUrl('/audit-logs/meta'), () => failure(500, 'Filter vocabulary unavailable.')),
  ],
  /**
   * A log whose actions the panel does not know, in the **two** ways that can happen.
   *
   * The first entry's `action` is *absent*, which is `F-028` — the panel called `.split('_')`
   * and `.endsWith(…)` on `undefined` and the `ErrorBoundary` replaced the whole screen with
   * "This page could not be displayed.". The rest carry a value the panel has simply never
   * heard of, which is not a defect at all: the compiled action lists are not filters, the
   * dropdowns come from `/…/meta`, and `consumer-findings.md` C-10 already records the bundle
   * running behind the backend's vocabulary. A newer deployment is the ordinary case.
   *
   * Both are here because they look identical in a bug report and are not the same thing: one
   * is the panel crashing, the other is the panel doing its job.
   */
  'unknown-action': () => [
    http.get(apiUrl('/audit-logs'), () =>
      ok({
        auditLogs: db.auditLogs.map((entry, index) =>
          index === 0
            ? without({ ...entry }, 'action')
            : { ...entry, action: 'LECTURE_ARCHIVED' },
        ),
        nextCursor: null,
      }),
    ),
    http.get(apiUrl('/activity-logs'), () =>
      ok({
        activityLogs: db.activityLogs.map((entry, index) =>
          index === 0 ? without({ ...entry }, 'action') : { ...entry, action: 'PROFILE_VIEWED' },
        ),
        nextCursor: null,
      }),
    ),
  ],
  /**
   * The GitLab integration switched off, which is how most deployments run: the backend has no
   * credentials, reports `gitlabEnabled: false`, and answers the escalation endpoint `503`.
   */
  'gitlab-disabled': () => [
    http.get(apiUrl('/system/status'), () =>
      ok({ ...(db.systemStatus ?? {}), gitlabEnabled: false }),
    ),
    http.get(apiUrl('/reports'), () => ok({ bugReports: db.bugReports, gitlabEnabled: false })),
  ],
}

/**
 * @returns the overrides named by `?fault=a,b`, ignoring any name that is not a known fault
 */
function requestedFaults(): HttpHandler[] {
  const requested = new URLSearchParams(window.location.search).get('fault')
  if (!requested) return []
  return requested
    .split(',')
    .map((name) => FAULTS[name.trim()])
    .filter((fault) => fault !== undefined)
    .flatMap((fault) => fault())
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
