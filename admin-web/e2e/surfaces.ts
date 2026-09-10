import type { Page } from '@playwright/test'
import { ROUTES, open } from './routes'
import { signIn } from './signIn'

/**
 * Every modal the panel can open, and how to get to it.
 *
 * Twelve since 2026-09-10: the ratings row opens a read-only detail view (`F-083`, `F-089`).
 *
 * `docs/worklog.md` names the gap this closes: *"Layer 3b does not reach detail views… A
 * missing field inside any of them is caught by nothing in this suite. This is the round's
 * largest stated gap."* The modals are where the panel's actual work happens — editing a
 * comment, warning a user, escalating a bug — and until now nothing measured a single pixel
 * inside one.
 *
 * **This list is written by hand, and two tests keep it honest.** It cannot be derived from
 * the DOM: whether a control opens a dialog is only knowable by pressing it. So instead of
 * pretending to a discovery it cannot do, `surfaces.spec.ts` asserts the partition the way
 * `callSurface.integration.test.ts` does — every entry here must really open a named dialog,
 * and every route must either appear here or be named in {@link ROUTES_WITHOUT_MODALS} with a
 * reason. A route that grows its first modal fails the second test.
 */

/** One dialog, and the shortest honest path to it. */
export interface Surface {
  /** Reads as the test name, and must be unique. */
  readonly name: string
  /** The route it lives on, by the name `e2e/routes.ts` gives it. */
  readonly route: string
  /** Signs in, navigates, and presses whatever opens the dialog. */
  readonly reach: (page: Page) => Promise<void>
  /**
   * The dialog's accessible name once it is open. Asserted, so a modal renamed without this
   * list being updated fails rather than measuring the wrong dialog.
   */
  readonly dialogName: string | RegExp
  /**
   * The control that opened it, by accessible name, where focus must return on Escape. Absent
   * where the opener is a table row rather than a button — a row is not a focus target the
   * browser will restore to, and asserting it would be asserting the wrong thing.
   */
  readonly openerLabel?: string | RegExp
}

/** @param page the page; signs in and lands on the route with its content on screen */
async function goTo(page: Page, routeName: string): Promise<void> {
  const route = ROUTES.find((candidate) => candidate.name === routeName)
  if (!route) throw new Error(`No route named ${routeName}`)
  await open(page, route)
}

export const SURFACES: readonly Surface[] = [
  {
    name: 'the user profile',
    route: 'Users',
    reach: async (page) => {
      await goTo(page, 'Users')
      await page.getByRole('row', { name: /^Open the profile of / }).first().click()
    },
    dialogName: 'User Profile',
  },
  {
    name: 'the content editor',
    route: 'Comments',
    reach: async (page) => {
      await goTo(page, 'Comments')
      await page.getByRole('button', { name: /^Edit content by / }).first().click()
    },
    dialogName: /^Edit (comment|answer)$/,
    openerLabel: /^Edit content by /,
  },
  {
    name: 'the delete-content confirmation',
    route: 'Comments',
    reach: async (page) => {
      await goTo(page, 'Comments')
      await page.getByRole('button', { name: /^Delete content by / }).first().click()
    },
    dialogName: /^Delete /,
    openerLabel: /^Delete content by /,
  },
  {
    name: 'the lecture editor',
    route: 'Lectures & Professors',
    reach: async (page) => {
      await goTo(page, 'Lectures & Professors')
      await page.getByRole('button', { name: /^Edit / }).first().click()
    },
    dialogName: 'Edit lecture',
    openerLabel: /^Edit /,
  },
  {
    name: 'the delete-lecture confirmation',
    route: 'Lectures & Professors',
    reach: async (page) => {
      await goTo(page, 'Lectures & Professors')
      await page.getByRole('button', { name: /^Delete / }).first().click()
    },
    dialogName: 'Delete lecture',
    openerLabel: /^Delete /,
  },
  {
    name: 'the professor editor',
    route: 'Lectures & Professors',
    reach: async (page) => {
      await goTo(page, 'Lectures & Professors')
      await page.getByRole('tab', { name: /^Professors/ }).click()
      await page.getByRole('button', { name: /^Edit / }).first().click()
    },
    dialogName: 'Edit professor',
    openerLabel: /^Edit /,
  },
  {
    name: 'the rating details',
    route: 'Lectures & Professors',
    reach: async (page) => {
      await goTo(page, 'Lectures & Professors')
      await page.getByRole('tab', { name: /^Ratings/ }).click()
      await page.getByRole('row', { name: /^Open the rating by / }).first().click()
    },
    dialogName: 'Rating',
  },
  {
    name: 'the delete-rating confirmation',
    route: 'Lectures & Professors',
    reach: async (page) => {
      await goTo(page, 'Lectures & Professors')
      await page.getByRole('tab', { name: /^Ratings/ }).click()
      await page.getByRole('button', { name: /^Delete rating by / }).first().click()
    },
    dialogName: 'Delete rating',
    openerLabel: /^Delete rating by /,
  },
  {
    name: 'the bug report',
    route: 'Bug Reports',
    reach: async (page) => {
      await goTo(page, 'Bug Reports')
      await page.getByRole('button', { name: /^Open bug report: / }).first().click()
    },
    dialogName: 'Bug Report',
    openerLabel: /^Open bug report: /,
  },
  {
    name: 'the audit detail panel',
    route: 'Audit Logs',
    reach: async (page) => {
      await goTo(page, 'Audit Logs')
      await page.getByRole('row', { name: /^Open audit event / }).first().click()
    },
    dialogName: 'Audit Event Details',
  },
  {
    name: 'the undo confirmation',
    route: 'Audit Logs',
    reach: async (page) => {
      await goTo(page, 'Audit Logs')
      await page.getByRole('row', { name: /^Open audit event / }).first().click()
      await page.getByRole('button', { name: 'Undo this change' }).click()
    },
    dialogName: 'Undo this change',
    // No `openerLabel`, and it is measured rather than omitted for convenience: this is the
    // one dialog that opens on top of another, and Escape closes both. Focus comes back to the
    // audit row that opened the detail panel underneath, not to the Undo button that opened
    // this — which is the right place to land, since the button is gone with its modal.
  },
  {
    name: 'the activity detail panel',
    route: 'Activity Logs',
    reach: async (page) => {
      await goTo(page, 'Activity Logs')
      await page.getByRole('row', { name: /^Open activity event / }).first().click()
    },
    dialogName: 'Activity Details',
  },
] as const

/**
 * Routes with no modal at all, each with the reason.
 *
 * An exemption list claims something, so this one claims only what was looked at. If any of
 * these grows a dialog, `surfaces.spec.ts` fails rather than quietly measuring one route
 * fewer — the same shape as the call-surface sweep's `EXEMPT`.
 */
export const ROUTES_WITHOUT_MODALS: Readonly<Record<string, string>> = {
  'Sign in': 'Two forms and no dialog. Covered as a form below, and by signing-in.spec.ts.',
  Dashboard: 'Read-only. Its cards navigate rather than open anything.',
  Help: 'Static reference content. It has no controls beyond its own accordions.',
}

/** One form, and how to reach the page it is on. Forms are measured for labels and tab order. */
export interface FormSurface {
  readonly name: string
  readonly reach: (page: Page) => Promise<void>
  /** A selector for the `<form>` itself, since a page may hold more than one. */
  readonly selector: string
}

/**
 * The panel's forms, including the two that are not inside a dialog.
 *
 * The filter bars are forms in the literal sense — a `<form>` with a submit button — and they
 * are the controls an operator uses most often, so they are measured with the rest rather than
 * left out for not being modal.
 */
export const FORMS: readonly FormSurface[] = [
  {
    name: 'the sign-in email step',
    reach: async (page) => {
      await page.goto('/login')
      await page.getByText(/Pop in your KIT student email/).first().waitFor()
    },
    selector: 'form',
  },
  {
    name: "the users filter bar",
    reach: async (page) => {
      await signIn(page, '/users')
      await page.getByText(/Everyone who's signed up/).first().waitFor()
    },
    selector: 'form',
  },
  {
    name: 'the audit log filter bar',
    reach: async (page) => {
      await signIn(page, '/audit-logs')
      await page.getByText(/A trace of successful admin actions/).first().waitFor()
    },
    selector: 'form',
  },
  {
    name: 'the activity log filter bar',
    reach: async (page) => {
      await signIn(page, '/activity-logs')
      await page.getByText(/Everything people do in the app/).first().waitFor()
    },
    selector: 'form',
  },
] as const
