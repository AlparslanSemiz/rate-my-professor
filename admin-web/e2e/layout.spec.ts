/// <reference lib="dom" />
// `tsconfig.e2e.json` leaves `DOM` out of `lib` on purpose: a spec runs in Node and drives a
// browser, so a top-level `document` should not compile. The bodies of `page.evaluate` are the
// exception — they are serialised and run *in the page*, so they are browser code living in a
// Node file, and TypeScript cannot tell the two apart. The reference is per-file rather than in
// the shared config so the guard still holds for every other spec.

import { expect, test } from '@playwright/test'
import { MEASURABLE_WIDTHS } from './measure'
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
/**
 * Widths worth measuring at, once `F-019` has taken the narrow ones away.
 *
 * **800 is now measured too.** It used to say "nothing below 1024", which was one width more
 * cautious than the finding requires: the test below pins the navbar at 240px from 800 up, so
 * from 800 up there is a panel on screen to measure. Everything at or below 768 is still
 * recorded as *not measured* rather than passed.
 */
const USABLE_WIDTHS = MEASURABLE_WIDTHS
/** The routes that draw a `<table>`, so an empty measurement loop cannot pass as a clean one. */
const ROUTES_WITH_TABLES = new Set(['Users', 'Comments', 'Lectures & Professors', 'Audit Logs', 'Activity Logs'])
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

  /** @returns the navbar's width, and the content width it had to lay itself out in */
  const navAt = async (width: number) => {
    await page.setViewportSize({ width, height: HEIGHT })
    await page.getByText(/Everyone who's signed up/).first().waitFor()
    const box = await page.locator('nav').first().boundingBox()
    // `body`, not `documentElement`: Chromium reports the root's `clientWidth` as the whole
    // viewport even when `scrollbar-gutter: stable` has reserved part of it, so the root
    // says 320 while everything laid out inside it gets 310. The body is the box the
    // navbar is actually stretched across.
    const available = await page.evaluate(() => document.body.clientWidth)
    return { nav: Math.round(box?.width ?? 0), available }
  }

  for (const width of UNUSABLE_WIDTHS) {
    // Against the content width rather than the viewport width it was set from:
    // `scrollbar-gutter: stable` reserves the scrollbar's 10px on the root, so the widest
    // anything can be laid out is 10 short of the viewport. The claim is "the navbar *is* the
    // content width", and this is the number that says so.
    const { nav, available } = await navAt(width)
    expect(nav, `navbar at ${width}px`).toBe(available)
  }
  for (const width of USABLE_WIDTHS) {
    expect((await navAt(width)).nav, `navbar at ${width}px`).toBe(NAVBAR_WIDTH)
  }
})

for (const width of USABLE_WIDTHS) {
  for (const route of ROUTES) {
    /**
     * **State** — one route, loaded, at a width the panel is usable at.
     * **Action** — compare the document's scroll width with its client width, and every
     *              table's own scroll width with the box it is drawn in.
     * **Expected** — no more than it gets. A page that scrolls sideways has already
     *                overflowed; needing less than the viewport is the reserved gutter.
     */
    test(`${route.name} fits at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT })
      await open(page, route)

      const doc = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      // `toBeLessThanOrEqual`, not `toBe`. Overflow is `needs > gets`; equality was only ever a
      // proxy for it, and it held because the page happened to fill its viewport exactly. Since
      // `scrollbar-gutter: stable` the root always reserves the scrollbar's 10px, so a page that
      // does not scroll needs 10 less than it gets - which is the gutter doing its job, not
      // content going missing. Asserting equality here failed on 82 measurements that had
      // nothing wrong with them. `F-062`.
      expect(
        doc.scrollWidth,
        `${route.name} page scroll width at ${width}px`,
      ).toBeLessThanOrEqual(doc.clientWidth)

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
      // See the note on the same assertion above: overflow is `>`, and the stable gutter
      // makes a non-scrolling page legitimately narrower than its viewport.
      expect(
        doc.scrollWidth,
        `${path} page scroll width at ${width}px`,
      ).toBeLessThanOrEqual(doc.clientWidth)
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
    // Overflow is `>`; see the note on the first of these assertions. `F-062`.
    expect(
      doc.scrollWidth,
      `page scroll width with ?fault=${faults}`,
    ).toBeLessThanOrEqual(doc.clientWidth)

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

/**
 * **State** — every route that draws badges, at every usable width.
 * **Action** — measure each badge's *label* against the box it is drawn in.
 * **Expected** — no label is asked to fit in less room than it needs.
 *
 * **The box matters, and getting it wrong is what hid `F-075` for a whole round.** Mantine's
 * badge root is `width: fit-content`, so it shrinks instead of overflowing and every sweep of
 * `scrollWidth > clientWidth` over cells, rows and tables answered "nothing is clipped" while
 * the catalogue showed `ACTI...` on all 92 lectures and `INAC...` on the inactive ones. The
 * clipping happens one box further in: the label carries the `text-overflow: ellipsis`, and the
 * label is the only box that reports it.
 */
for (const width of USABLE_WIDTHS) {
  for (const route of ROUTES) {
    test(`${route.name} shows every badge label in full at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT })
      await open(page, route)

      const badges = await page.evaluate(() =>
        [...document.querySelectorAll('[class*="mantine-Badge-root"]')].map((badge) => {
          const label = badge.querySelector('[class*="mantine-Badge-label"]') ?? badge
          return {
            text: (badge.textContent ?? '').trim().slice(0, 30),
            needs: label.scrollWidth,
            gets: label.clientWidth,
          }
        }),
      )

      const clipped = badges.filter((badge) => badge.needs > badge.gets)
      console.log(`badges ${route.name} @${width}px: ${badges.length} measured, ${clipped.length} clipped`)
      expect(
        clipped.map((badge) => `${badge.text} needs ${badge.needs} gets ${badge.gets}`),
        `clipped badge labels on ${route.name} at ${width}px`,
      ).toEqual([])
    })
  }
}

/**
 * **State** — the catalogue, at the width where a dialog is opened in anger.
 * **Action** — record every panel's right edge, open a dialog, close it, record again.
 * **Expected** — the edges are where they were, at all three moments.
 *
 * `F-062`. Mantine locks the body while a dialog is up, and on a browser with classic
 * scrollbars that hands back the gutter the page was drawn around: measured on the live
 * catalogue at 1024, `documentElement.clientWidth` went 1015 -> 1024 -> 1015 and every panel's
 * right edge travelled +10px out and back. The finding sat open because the run that looked for
 * it used a Chromium with overlay scrollbars, where there is no gutter to take away — so this
 * measures the **edges**, which move either way, rather than the gutter, which does not.
 */
test('no panel edge moves when a dialog opens or closes', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: HEIGHT })
  await signIn(page, '/catalog')
  await page.locator('table').first().waitFor()

  const edges = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.panel')].map((panel) =>
        Math.round(panel.getBoundingClientRect().right),
      ),
    )

  const before = await edges()
  expect(before.length, 'panels found on the catalogue').toBeGreaterThan(0)

  await page.getByRole('row', { name: /^Edit / }).first().click()
  await page.getByRole('dialog').waitFor()
  const during = await edges()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  const after = await edges()

  console.log(`panel right edges: before=${before} during=${during} after=${after}`)
  expect(during, 'panel right edges while a dialog is open').toEqual(before)
  expect(after, 'panel right edges after the dialog closed').toEqual(before)
})
