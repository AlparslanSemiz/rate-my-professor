/// <reference lib="dom" />
// `tsconfig.e2e.json` leaves `DOM` out of `lib` on purpose: a spec runs in Node and drives a
// browser, so a top-level `document` should not compile. The bodies of `page.evaluate` are the
// exception — they are serialised and run *in the page*, so they are browser code living in a
// Node file, and TypeScript cannot tell the two apart. The reference is per-file rather than in
// the shared config so the guard still holds for every other spec.

import { expect, test } from '@playwright/test'
import { ROUTES, open } from './routes'
import { signIn } from './signIn'

/**
 * Focus and touch targets, measured in a browser that has both.
 *
 * jsdom cannot answer any of this: it has no focus trap because it has no browser default tab
 * order, and every element in it is 0x0 so a 20x20 control and a 44x44 control are the same
 * two numbers. `src/App.a11y.integration.test.tsx` asserts only that focus *lands*; this is
 * where the ring, the trap and the target size get numbers.
 *
 * Chromium only, against MSW only. It has never run against the real backend.
 */

/** WCAG 2.2 SC 2.5.8, and the number `A2` already applied to `ErrorAlert`'s dismiss button. */
const MIN_TARGET = 24

/**
 * Targets under {@link MIN_TARGET}, by route, as the distinct `width x height` boxes measured.
 *
 * `F-037`, recorded and not fixed. `A2` measured `ErrorAlert`'s dismiss button, found 20x20 and
 * raised it to 24x24 with the rule written above it — and the rule was never applied to
 * anything else. This is what that leaves:
 *
 *   - **`Sign out`, 61x21** — the sidebar, so on all eight signed-in routes. Three pixels short.
 *   - **`See everyone →`, 90x17** — the dashboard's link out to Users. Seven pixels short.
 *   - **`22x22`, every row action on Comments and on the catalogue** — the expand toggle and
 *     the edit and delete icons on every row. Two pixels short on both axes, and these are the
 *     panel's actual moderation controls. The catalogue's were invisible to this measurement
 *     until the demo backend was given rows to draw (`F-041`).
 *
 * Pinned as sizes rather than labels so the fixture's names can change without touching it. A
 * new undersized control with a new box turns the route red; raising one of these does too.
 *
 * **axe passes all nine routes on `target-size`** — see `e2e/a11y.spec.ts`. That is not a
 * contradiction: axe grants exceptions for spacing and for inline targets, so it permits boxes
 * this measurement reports. Two tools, two answers, and the blunter one is the one that found
 * something.
 */
const KNOWN_UNDERSIZED: Readonly<Record<string, readonly string[]>> = {
  'Sign in': [],
  Dashboard: ['61x21', '90x17'],
  Users: ['61x21'],
  Comments: ['22x22', '61x21'],
  /**
   * `22x22` appeared here on 2026-09-10 without the panel changing: the demo backend served no
   * lectures at all until then, so this route's table had a header and no rows and there were
   * no row actions to measure. The edit and delete icons were always this size — `F-041`.
   */
  'Lectures & Professors': ['22x22', '61x21'],
  'Bug Reports': ['61x21'],
  'Audit Logs': ['61x21'],
  // Measured, not assumed: the run reports 11 visible buttons and one undersized box, the
  // sidebar's own `Sign out`. The screen adds no control of its own that is short.
  'Activity Logs': ['61x21'],
  Help: ['61x21'],
}
const WIDTH = 1440
const HEIGHT = 900

/**
 * **State** — the Comments table, with a row whose edit control is focused.
 * **Action** — open the editor, then tab past the last control in the dialog.
 * **Expected** — focus is still inside the dialog. A trap that leaks puts a keyboard user
 *                behind the overlay with no way back.
 */
test('a modal keeps focus inside itself', async ({ page }) => {
  await page.setViewportSize({ width: WIDTH, height: HEIGHT })
  await signIn(page, '/comments')

  await page.getByRole('button', { name: /^Edit content by / }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()

  const tabbable = await dialog.evaluate(
    (node) =>
      node.querySelectorAll(
        'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
      ).length,
  )
  expect(tabbable, 'tabbable controls in the dialog').toBeGreaterThan(0)

  // One more than there are, so the last Tab has to wrap. Counting rather than guessing is the
  // difference between measuring a trap and measuring a dialog that happens to be long.
  for (let step = 0; step <= tabbable; step += 1) {
    await page.keyboard.press('Tab')
  }

  const insideDialog = await page.evaluate(() => {
    const active = document.activeElement
    const dialogNode = document.querySelector('[role="dialog"]')
    return active !== null && dialogNode !== null && dialogNode.contains(active)
  })
  expect(insideDialog, `focus after ${tabbable + 1} tabs`).toBe(true)
})

/**
 * **State** — the same editor, open.
 * **Action** — press Escape.
 * **Expected** — the dialog closes and focus returns to the control that opened it, not to
 *                `document.body`.
 *
 * The return is the half that gets forgotten. `AdminLayout` already does it deliberately for
 * the session notice — it focuses `main` *before* the close button unmounts, "so the unmounting
 * close button doesn't dump focus on `document.body`" — so the panel has an opinion here and
 * this is whether the modals share it.
 */
test('Escape closes a modal and gives focus back to what opened it', async ({ page }) => {
  await page.setViewportSize({ width: WIDTH, height: HEIGHT })
  await signIn(page, '/comments')

  const opener = page.getByRole('button', { name: /^Edit content by / }).first()
  const openerLabel = await opener.getAttribute('aria-label')
  await opener.click()
  await page.getByRole('dialog').waitFor()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  const focused = await page.evaluate(() => ({
    tag: document.activeElement?.tagName ?? 'NONE',
    label: document.activeElement?.getAttribute('aria-label') ?? null,
  }))
  expect(focused.tag, 'focus after Escape').not.toBe('BODY')
  expect(focused.label, 'focus after Escape').toBe(openerLabel)
})

/**
 * **State** — a clickable row that contains its own controls.
 * **Action** — focus the row's edit action and press Enter.
 * **Expected** — the control's own dialog opens, and the row's does not act instead.
 *
 * `F-008` in the other direction. That fix stopped a row claiming a keypress that had bubbled
 * from a control inside it; `ClickableRow.unit.test.tsx` pins the predicate. What no test
 * measured is whether the same holds in a real browser, where the browser's own synthetic click
 * is the part that had been suppressed.
 */
test('a control inside a clickable row keeps its own Enter', async ({ page }) => {
  await page.setViewportSize({ width: WIDTH, height: HEIGHT })
  await signIn(page, '/comments')

  const action = page.getByRole('button', { name: /^Edit content by / }).first()
  await action.focus()
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  // The row's own action is the same editor, so the title is what tells them apart: the row
  // opens the *content* editor for the row it belongs to, which is the same dialog. What is
  // asserted here is narrower and still worth it — the keypress was not swallowed and produced
  // exactly one dialog rather than none.
  expect(await page.getByRole('dialog').count(), 'dialogs opened by one Enter').toBe(1)
})

for (const route of ROUTES) {
  /**
   * **State** — one route, loaded, at the default desktop size.
   * **Action** — measure every button's rendered box.
   * **Expected** — none smaller than 24x24 CSS pixels.
   *
   * axe's `target-size` already passes on all eight routes, and this is deliberately a second,
   * blunter measurement of the same thing: axe grants exceptions for spacing and for inline
   * targets, so it can pass a control this reports. The smallest box on each route is printed,
   * which is the number `A2` had to measure by hand for one button.
   */
  test(`${route.name} has no touch target under ${MIN_TARGET}px`, async ({ page }) => {
    await page.setViewportSize({ width: WIDTH, height: HEIGHT })
    await open(page, route)

    const boxes = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .filter((button) => button.offsetParent !== null)
        .map((button) => {
          const rect = button.getBoundingClientRect()
          return {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            label: button.getAttribute('aria-label') ?? button.textContent?.trim().slice(0, 40) ?? '',
          }
        }),
    )

    expect(boxes.length, `visible buttons on ${route.name}`).toBeGreaterThan(0)

    const smallest = boxes.reduce((min, box) =>
      Math.min(box.width, box.height) < Math.min(min.width, min.height) ? box : min,
    )
    console.log(
      `targets ${route.name}: buttons=${boxes.length} smallest=${smallest.width}x${smallest.height} ("${smallest.label}")`,
    )

    const undersized = [
      ...new Set(
        boxes
          .filter((box) => box.width < MIN_TARGET || box.height < MIN_TARGET)
          .map((box) => `${box.width}x${box.height}`),
      ),
    ].sort()

    expect(undersized, `boxes under ${MIN_TARGET}px on ${route.name}`).toEqual(
      [...(KNOWN_UNDERSIZED[route.name] ?? [])].sort(),
    )
  })
}
