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
 * Does it fit — measured, in a browser that computes layout.
 *
 * jsdom answers this wrongly rather than not at all: every element there is 0x0, so a table
 * twice as wide as its container and a table that fits are the same two numbers. That is the
 * whole reason this layer exists, and it is why every assertion below is a comparison of
 * measured pixels rather than a judgement.
 *
 * Chromium only, against MSW only. It has never run against the real backend.
 */

/** The panel's own navbar width above the breakpoint, from `AdminLayout`'s `AppShell`. */
const NAVBAR_WIDTH = 240
/** Widths worth measuring at, once `F-019` has taken the narrow ones away. */
const USABLE_WIDTHS = [1024, 1440]
/** The routes that draw a `<table>`, so an empty measurement loop cannot pass as a clean one. */
const ROUTES_WITH_TABLES = new Set(['Users', 'Comments', 'Lectures & Professors', 'Audit Logs'])
/** Where `F-019` lives. Mantine's `sm` is 48em; the navbar is uncollapsed at and below it. */
const UNUSABLE_WIDTHS = [320, 480, 640, 768]
const HEIGHT = 900

/**
 * **State** — signed in, at each of seven widths from 320 to 1440.
 * **Action** — measure the navbar against the viewport.
 * **Expected** — at or below 768 the navbar *is* the viewport; from 800 up it is 240.
 *
 * This is `F-019` given a boundary. Its record was two screenshots, at 320 and 768, described
 * as "below the `sm` breakpoint"; this pins the first usable width at **800** and shows the
 * dead zone is four widths wide, not two. Recorded, not fixed — what the navigation *becomes*
 * on a narrow screen is a design decision and `DESIGN.md` §Method applies.
 *
 * It is also why nothing else in this file is measured below 1024: at those widths the panel is
 * not on screen to measure, so a clean overflow number there would describe the sidebar.
 * **Not measured is not the same as passed**, and this test is the difference written down.
 */
test('the panel cannot be measured at or below 768px, and the boundary is 800', async ({ page }) => {
  await signIn(page, '/users')

  const widthOfNavAt = async (width: number) => {
    await page.setViewportSize({ width, height: HEIGHT })
    await page.getByText(/Everyone who's signed up/).first().waitFor()
    const box = await page.locator('nav').first().boundingBox()
    return Math.round(box?.width ?? 0)
  }

  for (const width of UNUSABLE_WIDTHS) {
    expect(await widthOfNavAt(width), `navbar at ${width}px`).toBe(width)
  }
  for (const width of [800, ...USABLE_WIDTHS]) {
    expect(await widthOfNavAt(width), `navbar at ${width}px`).toBe(NAVBAR_WIDTH)
  }
})

for (const width of USABLE_WIDTHS) {
  for (const route of ROUTES) {
    /**
     * **State** — one route, loaded, at a width the panel is usable at.
     * **Action** — compare the document's scroll width with its client width, and every
     *              table's own scroll width with the box it is drawn in.
     * **Expected** — equal. A page that scrolls sideways has already overflowed.
     */
    test(`${route.name} fits at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT })
      await open(page, route)

      const doc = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(doc.scrollWidth, `${route.name} page scroll width at ${width}px`).toBe(doc.clientWidth)

      const tables = await page.evaluate(() =>
        [...document.querySelectorAll('table')].map((table) => {
          const holder = table.parentElement
          return {
            tableScroll: table.scrollWidth,
            holderClient: holder?.clientWidth ?? 0,
            scrollable: holder ? getComputedStyle(holder).overflowX !== 'visible' : false,
          }
        }),
      )

      // Without this the loop below is vacuous on a route whose table failed to render, and a
      // page that showed no table at all would report the cleanest result in the file.
      if (ROUTES_WITH_TABLES.has(route.name)) {
        expect(tables.length, `tables found on ${route.name}`).toBeGreaterThan(0)
      }

      for (const [index, table] of tables.entries()) {
        const overflow = table.tableScroll - table.holderClient
        // Reported whether it fits or not. An earlier version of this test *skipped* every
        // table whose holder scrolls, which is every table that overflows — so it measured only
        // the ones that could not fail. The number is the point of the layer.
        console.log(
          `layout ${route.name} @${width}px table ${index}: needs=${table.tableScroll} ` +
            `gets=${table.holderClient} overflow=${overflow} scrollable=${table.scrollable}`,
        )

        // A table wider than its holder is acceptable **only** where the holder scrolls: that is
        // a deliberate horizontal scroller. Without one the last columns are clipped and no
        // input reaches them, which is content the operator cannot get to at all.
        if (overflow > 0) {
          expect(table.scrollable, `table ${index} on ${route.name} at ${width}px overflows by ${overflow}px and its holder does not scroll`).toBe(true)
        }
      }
    })
  }
}

/**
 * **State** — the longest label, username, lecture title and comment the columns can be handed,
 *             injected with `?fault=long-content`.
 * **Action** — load Users and Comments at both usable widths and measure.
 * **Expected** — the page still does not scroll sideways.
 *
 * The demo data is chosen to look like a real backend at the Abnahme, so measuring against it
 * reports the width of the fixture rather than the width of the column. A layout breaks on its
 * worst case, and this is the worst case.
 */
for (const width of USABLE_WIDTHS) {
  for (const path of ['/users', '/comments']) {
    test(`${path} survives its longest content at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT })
      await signIn(page, path)
      await page.goto(`${path}?fault=long-content`)
      await page.locator('table').first().waitFor()

      const doc = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(doc.scrollWidth, `${path} page scroll width at ${width}px`).toBe(doc.clientWidth)
    })
  }
}

/**
 * **State** — the session notice showing, the page-level error showing, and both together.
 * **Action** — load the dashboard with each `?fault=` combination and measure.
 * **Expected** — nothing leaves the viewport, with one strip or with two.
 *
 * `A2` added the shell's notice and `AdminLayout` says the two stack deliberately, session
 * first. What that costs in vertical space was looked at once, in a screenshot; this measures
 * it, and measures the case the screenshot could not easily produce — both at once.
 */
for (const faults of ['session-check', 'system-status', 'session-check,system-status']) {
  test(`the alert strips push nothing off screen with ?fault=${faults}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: HEIGHT })
    await signIn(page, '/dashboard')
    await page.goto(`/dashboard?fault=${faults}`)

    const alerts = page.locator('[role="alert"], [role="status"]')
    await alerts.first().waitFor()
    expect(await alerts.count(), `strips for ?fault=${faults}`).toBeGreaterThan(0)

    const doc = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))
    expect(doc.scrollWidth, `page scroll width with ?fault=${faults}`).toBe(doc.clientWidth)

    // Every strip must be inside the viewport horizontally, not merely present in the DOM.
    const boxes = await alerts.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect()
        return { left: Math.round(rect.left), right: Math.round(rect.right) }
      }),
    )
    for (const [index, box] of boxes.entries()) {
      expect(box.left, `strip ${index} left edge`).toBeGreaterThanOrEqual(0)
      expect(box.right, `strip ${index} right edge`).toBeLessThanOrEqual(1440)
    }
  })
}
