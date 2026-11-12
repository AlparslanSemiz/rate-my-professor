import { MantineProvider } from '@mantine/core'
import { render, screen, waitFor } from '@testing-library/react'
import { delay, http } from 'msw'
import { Component, type ReactElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import ActivityLogsPage from '@/features/logs/ActivityLogsPage'
import AuditLogsPage from '@/features/logs/AuditLogsPage'
import CatalogPage from '@/features/catalog/CatalogPage'
import CommentsPage from '@/features/comments/CommentsPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import FeedbackPage from '@/features/feedback/FeedbackPage'
import UsersPage from '@/features/users/UsersPage'
import { AuthProvider } from '@/context/AuthContext'
import { apiUrl } from '@/test/msw/apiUrl'
import { seedDb } from '@/test/msw/db'
import { ok } from '@/test/msw/envelope'
import { setSessionUser } from '@/test/msw/handlers/auth'
import { withQueryClient } from '@/test/queryClient'
import { server, startMockBackend } from '@/test/msw/server'
import { sweepFixture } from '@/test/msw/sweepFixture'

/**
 * What each screen does with a payload that is not what it expected.
 *
 * The companion to `src/api/responseShapes.integration.test.ts`, split along the axis where
 * the failure actually happens. A `503` is decided once, in `ApiResponseParser`, so that layer
 * asks it once per endpoint. A **missing field** is different: it passes the parser without
 * complaint and reaches a component, which is where it takes a screen down — `F-021` blanked
 * the audit table from a row that counted its own changes, and `F-022` does the same from an
 * accessible label. So this layer renders.
 *
 * **The question is "does the operator see anything at all".** Not "is the cell right" — a
 * dash where a name should be is a degraded screen, and a degraded screen is the intended
 * outcome. The failure being hunted is the blank page, and `getErrorMessage` is why it is
 * blank rather than wrong: it replaces `TypeError` and its siblings with a fallback, so an
 * internal error thrown during render is never a sentence on screen. It is the `ErrorBoundary`.
 *
 * The field lists are generated from the fixtures' own keys, so a field the backend adds is
 * swept without anybody adding a case for it.
 */
startMockBackend()

const ADMIN = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'unzhz@student.kit.edu',
  role: 'ADMIN',
}

/**
 * Catches what the real boundaries would catch, so a crash is a value this test can assert on
 * rather than an exception that fails it with a stack from somewhere else.
 *
 * The panel mounts two — `App.tsx` around everything and `AdminRoutes.tsx` around the routed
 * page — and this stands in for the inner one, which is the one a screen's own crash reaches.
 */
class CrashRecorder extends Component<{ onCrash: (error: Error) => void; children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false }

  static getDerivedStateFromError() {
    return { crashed: true }
  }

  componentDidCatch(error: Error) {
    this.props.onCrash(error)
  }

  render() {
    return this.state.crashed ? <p>the page could not be displayed</p> : this.props.children
  }
}

/** One record, with one key left out — the shape a serializer that omits an empty field sends. */
type Wire = Record<string, unknown>

/**
 * A screen, the read it depends on, and one record whose keys drive the sweep.
 *
 * `body` rather than a response key, because not every screen reads a list: the dashboard's
 * counters arrive as the response object itself, and pretending otherwise would have excluded
 * the one read whose absence the dashboard has a documented opinion about.
 */
interface Screen {
  readonly name: string
  readonly element: () => ReactElement
  /** The path whose answer is degraded. */
  readonly path: string
  /** The heading that means the screen rendered. */
  readonly heading: string | RegExp
  /**
   * Whether the read answers with a list. The dashboard's counters are the response object
   * itself, so asking it to serve three of them describes no backend that exists.
   */
  readonly isList: boolean
  /** The record whose keys are swept, and which `body` is handed back mutated. */
  readonly record: Wire
  readonly body: (records: Wire[]) => Wire
  /** Fields left alone, each with the finding that already covers it. */
  readonly skip?: Readonly<Record<string, string>>
  /**
   * The mutations that take this screen down today, keyed `kind:field` and valued with the
   * finding that records them.
   *
   * A pin, not a tolerance list. A crash that is not here turns the case red, and a case here
   * that stops crashing turns it red too — so fixing one of these is noticed as loudly as
   * introducing another. The same shape as the two `F-022` tests, which record what happens
   * rather than assert what should.
   */
  readonly crashesOn?: Readonly<Record<string, string>>
}

/** Long enough to observe the loading state, short enough not to pad the suite. */
const SLOW_MS = 60

const fixture = sweepFixture()
const listBody = (key: string) => (records: Wire[]) => ({ [key]: records })

const SCREENS: readonly Screen[] = [
  {
    name: 'Users',
    element: () => <UsersPage />,
    path: '/users',
    heading: 'Users',
    isList: true,
    record: fixture.users![0] as unknown as Wire,
    body: listBody('users'),
    crashesOn: {
      'absent:role': 'F-028',
      'absent:status': 'F-028',
      'wrongType:role': 'F-028',
      'wrongType:status': 'F-028',
    },
  },
  {
    name: 'Comments',
    element: () => <CommentsPage />,
    path: '/comments',
    heading: 'Comments',
    isList: true,
    record: fixture.comments![0] as unknown as Wire,
    body: listBody('comments'),
    crashesOn: {
      'absent:content': 'F-029',
      'absent:status': 'F-028',
      'wrongType:status': 'F-028',
    },
    skip: {
      // Measured and deferred: the row reads the name into its accessible label and throws
      // before anything is painted. Two tests in `CommentsPage.integration.test.tsx` already
      // record it, and re-recording it here would report one defect as two.
      author: 'F-022',
    },
  },
  {
    name: 'Lectures & Professors',
    element: () => <CatalogPage />,
    // The admin read, since `F-006`: the screen lists inactive rows too and filters them on
    // screen. A degraded payload has to arrive on the path the panel actually asks for.
    path: '/data/lectures/all',
    heading: 'Lectures & Professors',
    isList: true,
    record: fixture.lectures![0] as unknown as Wire,
    body: listBody('lectures'),
    crashesOn: {
      'absent:lectureType': 'F-028',
      'wrongType:lectureType': 'F-028',
      'absent:professors': 'F-029',
    },
  },
  {
    name: 'Bug Reports',
    element: () => <FeedbackPage />,
    path: '/reports',
    heading: 'Bug Reports',
    isList: true,
    record: fixture.bugReports![0] as unknown as Wire,
    body: listBody('bugReports'),
    crashesOn: {
      'absent:severity': 'F-028',
      'absent:status': 'F-028',
      'wrongType:severity': 'F-028',
      'wrongType:status': 'F-028',
    },
  },
  {
    name: 'Audit Logs',
    element: () => <AuditLogsPage />,
    path: '/audit-logs',
    heading: 'Audit Logs',
    isList: true,
    record: fixture.auditLogs![0] as unknown as Wire,
    body: listBody('auditLogs'),
    // No `crashesOn`. `absent:action` and `wrongType:action` were `F-028`'s two audit cases
    // until the log row started reading the action through `logEnumLabel` and the guarded
    // `auditActionColor` (ADR 0016). The other twelve are open, on four other screens.
    skip: {
      actor: 'F-022',
      // Fixed in `P0b` and pinned by two tests where the fix lives.
      changes: 'F-021',
      metadata: 'F-021',
    },
  },
  {
    name: 'Activity Logs',
    element: () => <ActivityLogsPage />,
    path: '/activity-logs',
    heading: 'Activity Logs',
    isList: true,
    record: fixture.activityLogs![0] as unknown as Wire,
    body: listBody('activityLogs'),
    // **No `crashesOn`, and that empty is the assertion.** The audit screen carried
    // `absent:action` and `wrongType:action` as `F-028` until both screens started reading the
    // action through `logEnumLabel` and a guarded colour function. This row is what stops that
    // guard being removed quietly: it goes red the moment an unknown action takes the screen
    // down again, on the screen most likely to be handed one.
    skip: {
      // The same unguarded `actor` read the audit row has. One defect, recorded once.
      actor: 'F-022',
    },
  },
  {
    name: 'Dashboard',
    element: () => <DashboardPage />,
    path: '/system/status',
    // The dashboard has no page title of its own; the shell greets the operator instead.
    heading: /Welcome back/,
    isList: false,
    record: fixture.systemStatus as unknown as Wire,
    // Not a list: the counters are the response object itself.
    body: (records) => records[0],
  },
]

function renderScreen(screen: Screen) {
  localStorage.setItem('token', 'admin-token')
  localStorage.setItem('user', JSON.stringify(ADMIN))
  setSessionUser({ id: ADMIN.id, username: ADMIN.name, kitEmail: ADMIN.email, role: 'ADMIN' })

  let crash: Error | null = null
  const view = render(
    <MantineProvider>
      {/* The dashboard's module cards navigate, so the routed context is part of the screen. */}
      <MemoryRouter>
        <AuthProvider>
          <CrashRecorder onCrash={(error) => { crash = error }}>
            {withQueryClient(screen.element())}
          </CrashRecorder>
        </AuthProvider>
      </MemoryRouter>
    </MantineProvider>,
  )
  return { view, crashOf: () => crash }
}

/**
 * @returns nothing; throws when the screen ended up blank
 *
 * "Not blank" is deliberately generous: the heading, or any alert region carrying text. A
 * screen that renders its header and an error above an empty table has done the right thing;
 * a screen that renders the boundary's fallback has not.
 */
async function expectOutcome(heading: string | RegExp, crashOf: () => Error | null, pinned: string | undefined) {
  await waitFor(() => {
    const shown =
      screen.queryByText(heading) !== null ||
      [...screen.queryAllByRole('alert'), ...screen.queryAllByRole('status')].some(
        (region) => (region.textContent ?? '').trim() !== '',
      )
    expect(shown || crashOf() !== null).toBe(true)
  })

  if (pinned) {
    // Recorded, not fixed. `${pinned}` says where.
    expect(crashOf()).not.toBeNull()
    return
  }

  expect(crashOf()).toBeNull()
}

/** @returns the keys worth removing, generated from the record rather than written out */
function sweepableFields(screen: Screen): string[] {
  return Object.keys(screen.record).filter((field) => !(screen.skip && field in screen.skip))
}

describe.each(SCREENS)('$name', (screen) => {
  beforeEach(() => {
    seedDb(fixture)
  })

  it.each(sweepableFields(screen).map((field) => ({ field })))(
    'survives a payload with no `$field`',
    async ({ field }) => {
      const degraded: Wire = { ...screen.record }
      delete degraded[field]
      server.use(http.get(apiUrl(screen.path), () => ok(screen.body([degraded]))))

      const { crashOf } = renderScreen(screen)
      await expectOutcome(screen.heading, crashOf, screen.crashesOn?.[`absent:${field}`])
    },
  )

  it.each(
    Object.entries(screen.record)
      .filter(([, value]) => value !== null && typeof value === 'object' && !Array.isArray(value))
      .filter(([field]) => !(screen.skip && field in screen.skip))
      .map(([field]) => ({ field })),
  )('survives `$field` arriving as null', async ({ field }) => {
    server.use(
      http.get(apiUrl(screen.path), () => ok(screen.body([{ ...screen.record, [field]: null }]))),
    )

    const { crashOf } = renderScreen(screen)
    await expectOutcome(screen.heading, crashOf, screen.crashesOn?.[`null:${field}`])
  })

  it.each(
    Object.entries(screen.record)
      .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
      .filter(([field]) => !(screen.skip && field in screen.skip))
      .map(([field, value]) => ({ field, wrong: typeof value === 'number' ? 'not a number' : 42 })),
  )('survives `$field` arriving as the wrong type', async ({ field, wrong }) => {
    server.use(
      http.get(apiUrl(screen.path), () => ok(screen.body([{ ...screen.record, [field]: wrong }]))),
    )

    const { crashOf } = renderScreen(screen)
    await expectOutcome(screen.heading, crashOf, screen.crashesOn?.[`wrongType:${field}`])
  })

  it.skipIf(!screen.isList).each([{ count: 0 }, { count: 1 }, { count: 3 }])('survives a list of $count', async ({ count }) => {
    const records = Array.from({ length: count }, (_, index) => ({
      ...screen.record,
      id: `${String(screen.record.id)}-${index}`,
    }))
    server.use(http.get(apiUrl(screen.path), () => ok(screen.body(records))))

    const { crashOf } = renderScreen(screen)
    await expectOutcome(screen.heading, crashOf, undefined)
  })

  it('shows a loading state while the read is slow, rather than an empty screen', async () => {
    server.use(
      http.get(apiUrl(screen.path), async () => {
        await delay(SLOW_MS)
        return ok(screen.body([screen.record]))
      }),
    )

    const { view, crashOf } = renderScreen(screen)

    // The question `F-011` is about: an empty state and a pending read look identical to an
    // operator unless the screen says which it is.
    await waitFor(() => {
      expect(view.container.querySelector('.mantine-Loader-root')).not.toBeNull()
    })

    await expectOutcome(screen.heading, crashOf, undefined)
  })
})
