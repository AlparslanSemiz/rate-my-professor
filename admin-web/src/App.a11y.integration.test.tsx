import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import type { User } from '@/api/users'
import { apiClient } from '@/api/client'
import { RULES_JSDOM_CANNOT_ANSWER, violationsIn } from '@/test/a11y'
import { seedDb } from '@/test/msw/db'
import { setSessionUser } from '@/test/msw/handlers/auth'
import { startMockBackend } from '@/test/msw/server'
import { sweepFixture } from '@/test/msw/sweepFixture'
import { routes } from './constants/routes'
import App from './App'

/**
 * The accessibility layer.
 *
 * `docs/testplan.md` §6.4 recorded "nothing anywhere asserts accessibility" as the largest
 * single gap in the suite. This closes the half of it jsdom can reach, and is explicit about
 * the other half rather than quiet about it.
 *
 * **What this measures:** the whole signed-in shell at each of the eight routes, against every
 * axe rule that does not need layout — roles, names, labels, landmarks, heading order, list
 * structure, form field association, duplicate ids, `aria-*` validity.
 *
 * **What it does not measure:** anything that needs a box or a colour. Every element in jsdom
 * is 0x0 and no style is composited, so `color-contrast` and `target-size` are switched off by
 * name in `src/test/a11y.ts` and measured in Chromium in `e2e/a11y.spec.ts` instead. A visible
 * focus *ring* is in the same category — here we assert only that focus lands where it should.
 * Screen-reader announcement order, and anything a real assistive technology does with this
 * markup, is measured nowhere and is not claimed.
 *
 * **One more limit, because it is easy to read this as more than it is:** each route is scanned
 * as it first renders. A tab that is not the default one, a modal that has not been opened and
 * a row that has not been expanded are not scanned — so the catalogue's Professors and Ratings
 * tables, which share the defect found on its Lectures table, were found by reading rather than
 * by this file.
 */
startMockBackend()

const adminAccount: User = {
  id: 'admin-1',
  username: 'Admin User',
  kitEmail: 'ugoqu@student.kit.edu',
  role: 'ADMIN',
  status: 'ACTIVE',
  joined: '2025-01-10',
  lastOnline: '2026-06-11T18:30:00Z',
  biography: 'Platform administrator.',
  warnings: 0,
  reports: 0,
  credibilityScore: 100,
}

const adminUser = {
  id: adminAccount.id,
  name: adminAccount.username,
  email: adminAccount.kitEmail,
  role: adminAccount.role,
}

/**
 * Each route, and the text that means it has finished loading.
 *
 * Every page short-circuits to `PageLoader` while its first read is in flight, so scanning
 * before the marker appears would scan a spinner and report a clean result — the most
 * dangerous kind of green there is.
 *
 * The markers are page **descriptions**, not titles, and that is the whole point: every title
 * here is also a sidebar link, so `/Comments/` matches the navigation before the screen has
 * loaded anything. Written as titles first, this file reported eight clean routes while some of
 * them had not finished rendering — which is the failure the paragraph above describes, made by
 * the person who wrote it.
 */
/** See `openRoute` — long enough that a slow mount is not read as a missing page. */
const MARKER_TIMEOUT_MS = 5000

const ROUTES = [
  { path: routes.login, name: 'Sign in', knownViolations: [] as string[], marker: /Pop in your KIT student email/, signedIn: false },
  {
    path: routes.dashboard,
    name: 'Dashboard',
    marker: /A quick look at how your community's doing today/,
    signedIn: true,
    knownViolations: [] as string[],
  },
  { path: routes.users, name: 'Users', knownViolations: [] as string[], marker: /Everyone who's signed up/, signedIn: true },
  {
    path: routes.comments,
    name: 'Comments',
    marker: /Every comment in the app, with its answers nested underneath/,
    signedIn: true,
    /** `F-032` — see the note on the catalogue route below; the same column, the same cause. */
    knownViolations: ['empty-table-header'],
  },
  {
    path: routes.catalog,
    name: 'Lectures & Professors',
    marker: /The lectures students rate and the professors who teach them/,
    signedIn: true,
    /**
     * `F-032`, recorded and not fixed. Four tables end their column list with `''` for the
     * actions column — `ContentTable`, `LecturesTable`, `ProfessorsTable`, `RatingsTable` — so
     * `TableHeaderRow` renders `<th scope="col"></th>` and a screen reader announces nothing
     * for that column. Not a one-line fix: the panel has no visually-hidden utility, so naming
     * the column means either adding one or showing a word that is not in the design.
     */
    knownViolations: ['empty-table-header'],
  },
  { path: routes.feedback, name: 'Bug Reports', knownViolations: [] as string[], marker: /Bug reports and crash logs sent in by your users/, signedIn: true },
  { path: routes.auditLogs, name: 'Audit Logs', knownViolations: [] as string[], marker: /A trace of successful admin actions/, signedIn: true },
  {
    path: routes.activityLogs,
    name: 'Activity Logs',
    knownViolations: [] as string[],
    marker: /Everything people do in the app/,
    signedIn: true,
  },
  { path: routes.help, name: 'Help', knownViolations: [] as string[], marker: /What each status means and what happens when you use a control/, signedIn: true },
] as const

async function openRoute(route: (typeof ROUTES)[number]) {
  if (route.signedIn) {
    localStorage.setItem('token', 'admin-token')
    localStorage.setItem('user', JSON.stringify(adminUser))
  }
  window.history.pushState({}, '', route.path)

  const view = render(<App />)
  // Longer than the default second. This mounts the whole shell — provider, lazy chunk, two or
  // three reads — eight times in one file, and `F-024` is a timeout on exactly this marker
  // under load. Waiting longer does not hide that defect; it stops this layer inheriting it.
  await waitFor(
    () => expect(screen.queryAllByText(route.marker).length).toBeGreaterThan(0),
    { timeout: MARKER_TIMEOUT_MS },
  )
  return view
}

describe('every route, scanned by axe', () => {
  beforeEach(() => {
    apiClient.setToken(null)
    seedDb(sweepFixture())
    setSessionUser({
      id: adminAccount.id,
      username: adminAccount.username,
      kitEmail: adminAccount.kitEmail,
      role: 'ADMIN',
    })
  })

  it.each(ROUTES)('$name: what axe finds', async (route) => {
    const { container } = await openRoute(route)
    const violations = await violationsIn(container, route.name)

    if (route.knownViolations.length === 0) {
      expect(violations).toEqual([])
      return
    }

    // Recorded, not tolerated. Compared as a set of rule ids so the assertion reads as a claim
    // about *which* rules fail, not merely how many.
    expect(violations.map((violation) => violation.id).sort()).toEqual([...route.knownViolations].sort())
  })

  it('has no progress bars left to name', async () => {
    await openRoute(ROUTES.find((route) => route.name === 'Dashboard')!)

    // `F-030` named the dashboard's two progress bars, and this assertion pinned those names so
    // the route scan could not go green by the bars simply disappearing. `F-066` then removed
    // `SystemPulse` outright, because both bars re-rendered numbers the cards already carried.
    // The pin is inverted rather than deleted: it still fails if a bar comes back unnamed.
    expect(screen.queryAllByRole('progressbar')).toHaveLength(0)
  })

  it('says which rules it could not run, rather than counting them as passes', () => {
    // The exemption list is part of the result. A report that shows eight green routes without
    // this sentence claims two things it never measured.
    expect(Object.keys(RULES_JSDOM_CANNOT_ANSWER).sort()).toEqual(['color-contrast', 'target-size'])
  })
})

/** Everything the browser puts in the tab order, as a selector rather than as a list. */
const FOCUSABLE =
  'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * @param container the rendered tree
 * @returns the focusable elements a keyboard user would actually reach
 *
 * Disabled controls and anything inside an `aria-hidden` subtree are dropped: the browser skips
 * them, so asserting that focus lands on them would assert the opposite of what is wanted.
 */
function focusableIn(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      !element.closest('[aria-hidden="true"]') &&
      element.getAttribute('tabindex') !== '-1',
  )
}

describe('the keyboard', () => {
  beforeEach(() => {
    apiClient.setToken(null)
    seedDb(sweepFixture())
    setSessionUser({
      id: adminAccount.id,
      username: adminAccount.username,
      kitEmail: adminAccount.kitEmail,
      role: 'ADMIN',
    })
  })

  it.each(ROUTES)('$name: every control it offers can take focus', async (route) => {
    const { container } = await openRoute(route)

    const focusable = focusableIn(container)
    // A route that offers nothing to focus would pass the loop below vacuously. Every screen in
    // this panel has at least the sidebar, and the sign-in screen has its own form.
    expect(focusable.length).toBeGreaterThan(0)

    const unreachable = focusable.filter((element) => {
      element.focus()
      return document.activeElement !== element
    })

    expect(unreachable.map((element) => element.outerHTML.slice(0, 120))).toEqual([])
  })

  it('reaches every action inside a table row', async () => {
    const { container } = await openRoute(ROUTES.find((route) => route.name === 'Comments')!)

    const rowControls = [...container.querySelectorAll<HTMLElement>('tr')].flatMap((row) =>
      [...row.querySelectorAll<HTMLElement>('button, [role="button"]')],
    )
    // `ContentRow` carries an expand toggle, an author chip and two row actions, so a table
    // that offered none of them would mean the fixture never rendered a row.
    expect(rowControls.length).toBeGreaterThan(0)

    const unreachable = rowControls.filter((control) => {
      control.focus()
      return document.activeElement !== control
    })

    // The inverse of `F-008`. That one was a row stealing a keypress meant for a control inside
    // it; this is the question underneath it — whether those controls are reachable at all.
    expect(unreachable.map((control) => control.getAttribute('aria-label') ?? control.outerHTML.slice(0, 80))).toEqual([])
  })
})

/**
 * Arrows and geometric shapes, which stand in for an icon without being one.
 *
 * `docs/DESIGN.md` bans an emoji used as an icon because the panel has `@tabler/icons-react`.
 * A bare `\u2192` is the same substitution in a character the emoji sweep does not catch, and when it
 * sits inside a control it becomes part of that control's name — so a screen reader reads the
 * glyph out, or drops it, and neither is what the label meant to say.
 */
const GLYPH_STANDING_IN_FOR_AN_ICON = /[\u2190-\u21FF\u25A0-\u25FF\u2B00-\u2BFF]/u

/**
 * @param element a control the keyboard can reach
 * @returns the name a screen reader would announce for it
 *
 * `aria-label` wins over content, which is the only part of the accessible-name algorithm this
 * panel exercises: no control here is named by `aria-labelledby` or by a `title`.
 */
function accessibleName(element: HTMLElement): string {
  return (element.getAttribute('aria-label') ?? element.textContent ?? '').trim()
}

describe('controls that name themselves in words', () => {
  beforeEach(() => {
    apiClient.setToken(null)
    seedDb(sweepFixture())
    setSessionUser({
      id: adminAccount.id,
      username: adminAccount.username,
      kitEmail: adminAccount.kitEmail,
      role: 'ADMIN',
    })
  })

  it.each(ROUTES)('$name \u2014 no control leans on a glyph for its name', async (route) => {
    const { container } = await openRoute(route)

    const focusable = focusableIn(container)
    // A route that offered nothing would pass the filter below vacuously. The guard counts
    // controls rather than *named* controls: the sign-in screen opens with its submit button
    // disabled, so at first render it offers exactly one control and that one has no name of
    // its own — which is the keyboard sweep's business above, not this test's.
    expect(focusable.length).toBeGreaterThan(0)

    const leaning = focusable.filter((element) =>
      GLYPH_STANDING_IN_FOR_AN_ICON.test(accessibleName(element)),
    )

    expect(leaning.map((element) => accessibleName(element))).toEqual([])
  })
})

describe('information that colour alone would carry', () => {
  beforeEach(() => {
    apiClient.setToken(null)
    seedDb(sweepFixture())
    setSessionUser({
      id: adminAccount.id,
      username: adminAccount.username,
      kitEmail: adminAccount.kitEmail,
      role: 'ADMIN',
    })
  })

  it.each(ROUTES.filter((route) => route.signedIn))('$name: every status badge reads as text too', async (route) => {
    const { container } = await openRoute(route)

    const badges = [...container.querySelectorAll<HTMLElement>('.mantine-Badge-root')]
    const wordless = badges.filter((badge) => (badge.textContent ?? '').trim() === '')

    // Generated from what actually rendered, not from a list of the statuses somebody
    // remembered. A badge that carried its meaning only in `color` would be invisible to a
    // screen reader and to anyone who cannot separate the panel's green from its orange.
    expect(wordless.map((badge) => badge.outerHTML.slice(0, 120))).toEqual([])
  })
})

describe('a form field and the message about it', () => {
  beforeEach(() => {
    apiClient.setToken(null)
    seedDb(sweepFixture())
  })

  it('names the email field, and ties its refusal to it', async () => {
    const user = userEvent.setup()
    await openRoute(ROUTES[0])

    // The label is the association: `getByLabelText` fails if the `<label>` is not wired to the
    // input, so this is the assertion rather than a way of finding the field.
    const email = screen.getByLabelText(/Email/)
    await user.type(email, 'someone@example.com')
    await user.click(screen.getByRole('button', { name: 'Send me a code' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent?.trim()).not.toBe('')

    // Measured, not assumed: whether the refusal is *tied* to the field or merely near it.
    // `aria-describedby` is what a screen reader follows from the input to the message.
    const describedBy = email.getAttribute('aria-describedby')
    const tied =
      email.getAttribute('aria-invalid') === 'true' &&
      describedBy !== null &&
      describedBy.split(/\s+/).some((id) => document.getElementById(id)?.textContent?.trim())

    // `F-031`, fixed. The address is refused by `adminAccess` before any request goes out, and
    // the sentence explaining that is still rendered in the page-level `ErrorAlert` above the
    // form — but the field now points at it, so a screen-reader user who tabs back to the input
    // hears why it was rejected instead of silence. The field is deliberately *not* given
    // Mantine's `error` prop, which would also turn it red: this is an announcement fix, not a
    // visual one.
    expect(tied).toBe(true)
  })
})
