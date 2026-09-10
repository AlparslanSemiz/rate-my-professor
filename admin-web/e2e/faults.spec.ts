/// <reference lib="dom" />
// `tsconfig.e2e.json` leaves `DOM` out of `lib` on purpose: a spec runs in Node and drives a
// browser, so a top-level `document` should not compile. The bodies of `page.evaluate` are the
// exception — they are serialised and run *in the page*, so they are browser code living in a
// Node file, and TypeScript cannot tell the two apart. The reference is per-file rather than in
// the shared config so the guard still holds for every other spec.

import { expect, test } from '@playwright/test'
import { HEIGHT, MEASURABLE_WIDTHS, pageOverflow } from './measure'
import { signIn } from './signIn'

/**
 * What the panel looks like when something is wrong — measured, not screenshotted.
 *
 * `src/test/msw/browser.ts` exists because the states worth looking at are the ones nothing
 * reaches by clicking, and until now they were reached by hand and signed off by eye. This
 * puts numbers on them: an error state that pushes content off screen is worse than the error,
 * and an error state that renders nothing at all is worse still.
 *
 * `layout.spec.ts` already measures the two alert strips on the dashboard. This is the rest of
 * the registry, and the two faults added with the activity log.
 *
 * Chromium only, against MSW only.
 */

/** One fault, the screen it is worth seeing on, and what has to be on that screen. */
const FAULTS = [
  {
    name: 'users-filter',
    path: '/users',
    marker: /Everyone who's signed up/,
    /** Typing a search is what makes this handler refuse; without it the table loads normally. */
    provoke: async (page: import('@playwright/test').Page) => {
      await page.getByPlaceholder('Name or email...').fill('lena')
      await page.getByRole('button', { name: 'Apply filters' }).click()
    },
    shows: /Invalid user status/,
  },
  {
    name: 'log-meta',
    path: '/activity-logs',
    marker: /Everything people do in the app/,
    shows: /Filter vocabulary unavailable|could not|unavailable/i,
  },
  {
    name: 'unknown-action',
    path: '/audit-logs',
    marker: /A trace of successful admin actions/,
    /**
     * An action the panel has never heard of, read back as a label rather than as a crash.
     * `logEnumLabel` title-cases it, so `LECTURE_ARCHIVED` reads "Lecture Archived" — the
     * vocabulary is the backend's and the panel renders what it is given.
     */
    shows: /Lecture Archived/,
  },
] as const

for (const fault of FAULTS) {
  /**
   * **State** — one screen, loaded with `?fault=` in force.
   * **Action** — measure the document and look for the state the fault exists to produce.
   * **Expected** — the screen is still there, still says something, and still fits.
   */
  test(`?fault=${fault.name} renders a state rather than a blank screen`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: HEIGHT })
    await signIn(page, fault.path)
    // Read once at startup, so the faulted URL has to be navigated to rather than pushed.
    await page.goto(`${fault.path}?fault=${fault.name}`)
    await page.getByText(fault.marker).first().waitFor()

    if ('provoke' in fault) await fault.provoke(page)

    await expect(page.getByText(fault.shows).first()).toBeVisible()

    // The boundary's fallback is the failure this is looking for: a screen replaced rather than
    // degraded. `F-028` is what that looks like, and it is why the two log screens are here.
    await expect(page.getByText('This page could not be displayed.')).toBeHidden()
  })

  for (const width of MEASURABLE_WIDTHS) {
    test(`?fault=${fault.name} pushes nothing off screen at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT })
      await signIn(page, fault.path)
      await page.goto(`${fault.path}?fault=${fault.name}`)
      await page.getByText(fault.marker).first().waitFor()
      if ('provoke' in fault) await fault.provoke(page)

      const doc = await pageOverflow(page)
      console.log(`fault ${fault.name} @${width}px: page=${doc.needs}/${doc.gets}`)
      // `toBeLessThanOrEqual`, not `toBe`. Overflow is `needs > gets`; equality was only ever a
      // proxy for it, and it held because the page happened to fill its viewport exactly. Since
      // `scrollbar-gutter: stable` the root always reserves the scrollbar's 10px, so a page that
      // does not scroll needs 10 less than it gets - which is the gutter doing its job, not
      // content going missing. Asserting equality here failed on 82 measurements that had
      // nothing wrong with them. `F-062`.
      expect(
        doc.needs,
        `page scroll width with ?fault=${fault.name} at ${width}px`,
      ).toBeLessThanOrEqual(doc.gets)
    })
  }
}

/**
 * **State** — the audit log served one entry with **no** `action` at all, and the rest with one
 *             the panel has never heard of.
 * **Action** — list them, then open each kind.
 * **Expected** — both render, in the list and in the detail view.
 *
 * This is `F-028`'s two audit cases in a real browser rather than in jsdom, and it reaches the
 * half the resilience matrix cannot: that matrix pins the *row*, and the detail modal reads the
 * same action through the same two guards with nothing checking it.
 *
 * The absent action is the one that used to take the screen down. The unknown one never did —
 * a string the panel does not know is still a string — and it is here because in a bug report
 * the two are indistinguishable, so a test that only covered one would leave the other's
 * behaviour unstated.
 */
test('an action that is absent and one that is merely unknown both survive being opened', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: HEIGHT })
  await signIn(page, '/audit-logs')
  await page.goto('/audit-logs?fault=unknown-action')
  await page.getByText(/A trace of successful admin actions/).first().waitFor()

  // The entry with no action reads as the shared empty marker, in the row's own accessible name.
  const missing = page.getByRole('row', { name: /^Open audit event - by / }).first()
  await expect(missing).toBeVisible()
  await missing.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('This page could not be displayed.')).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  await page.getByRole('row', { name: /^Open audit event Lecture Archived/ }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  await expect(dialog.getByText('Lecture Archived').first()).toBeVisible()
  await expect(page.getByText('This page could not be displayed.')).toBeHidden()
})
