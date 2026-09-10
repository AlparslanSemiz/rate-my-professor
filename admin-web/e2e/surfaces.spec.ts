import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import {
  HEIGHT,
  MEASURABLE_WIDTHS,
  MIN_TARGET,
  controlsIn,
  focusStaysInside,
  focusedElement,
  overflowOf,
  pageOverflow,
  positiveTabIndexes,
  tableOverflows,
  tabOrder,
  settled,
  tally,
  undersized,
  unnamed,
} from './measure'
import { FORMS, ROUTES_WITHOUT_MODALS, SURFACES } from './surfaces'
import { ROUTES } from './routes'

/**
 * Inside the modals, which nothing has ever measured.
 *
 * Every other layer stops at the first render of a route. `docs/worklog.md` calls that the
 * round's largest stated gap, and it is where the panel's actual work happens: editing a
 * comment, warning a user, undoing a change, escalating a bug. This opens each one and asks
 * it the same questions the routes are asked — does it fit, can it be operated, does it hold
 * focus, does it give focus back.
 *
 * **It measures. Where a number is wrong it is pinned with a finding number, not fixed**,
 * unless the fix is one file with no visual effect. Chromium only, against MSW only.
 */

/**
 * Boxes under {@link MIN_TARGET} inside each dialog, as the distinct `WxH` measured.
 *
 * `F-040`, recorded and not fixed: raising any of these changes a row's height, and
 * `DESIGN.md` §Method asks for a visual pass. Read off the run, not predicted, and identical
 * at all three widths — these are inside a fixed-width dialog, so the viewport does not reach
 * them.
 *
 * A pin rather than a tolerance: a new undersized control turns its surface red, and so does
 * raising one of these. The two catalogue editors are the only dialogs with any.
 *
 *   - **`22x22`** — the `MultiSelect` pill's remove button, on both editors.
 *   - **`24x17` and `24x22`** — the `NumberInput` steppers on Semester year, and the `Select`
 *     chevrons. Two pixels short on one axis, seven on the other.
 *   - **`327x22`, `488x22`, `586x20`** — full-width controls that are short rather than
 *     narrow: the selected-value pills and the `Active` switch.
 */
const KNOWN_UNDERSIZED_IN: Readonly<Record<string, readonly string[]>> = {
  'the lecture editor': ['22x22', '24x17', '24x22', '327x22', '586x20'],
  'the professor editor': ['22x22', '24x22', '488x22', '586x20'],
}

/**
 * Dialogs that Escape does not close, and the finding that records why. **`F-042`.**
 *
 * The trigger is measured rather than guessed: this test tabs one step past the last control,
 * which in the lecture editor lands on the `Professors` `MultiSelect` — and Mantine opens that
 * combobox's dropdown on focus. From there:
 *
 *   1. the first Escape closes the dropdown (`aria-expanded` goes `true` → `false`) and leaves
 *      the modal open, which is correct;
 *   2. **the second Escape puts focus on `document.body` and still does not close the modal**;
 *   3. the third and fourth do nothing but let the trap pull focus back to a button.
 *
 * So once that field has been focused, Escape never closes the dialog again, and one press
 * drops the operator out of it. Not a trap — Cancel and the close button still work — but the
 * key that is supposed to dismiss a dialog stops doing so, silently.
 *
 * The professor editor has a `MultiSelect` too and is **not** here: its tab loop ends
 * elsewhere, so the state is not reached. That is a statement about what was measured, not a
 * claim that it cannot happen there.
 */
const ESCAPE_DOES_NOT_CLOSE: Readonly<Record<string, string>> = {
  'the lecture editor': 'F-042',
}

/** Dialogs whose content is wider than the box it is drawn in, by how much. None, measured. */
const KNOWN_OVERFLOW_IN: Readonly<Record<string, number>> = {}

/**
 * Colour-contrast failures inside each dialog, as axe decides them. **`F-038`.**
 *
 * This is the half of `F-035` the gradient was hiding. That finding records that axe can
 * decide only 46 of 407 nodes across the eight routes, because `interactive.css` paints the
 * panel's surfaces with a gradient and axe cannot compute a ratio against one — and the honest
 * conclusion drawn there was "46 measured, 1 failed", never "contrast is fine".
 *
 * A modal is painted on a flat `chrome.surface`, so axe *can* decide it. Opening the dialogs
 * turns most of that undetermined mass into an answer, and the answer is that four dialogs
 * fail: 9 nodes in the user profile, 9 in the audit detail panel, 10 in the undo confirmation,
 * 6 in the activity detail panel, 3 in the bug report and 1 in the content editor. Five
 * dialogs pass clean on the same surface, so this is specific text on specific components
 * rather than the panel's palette as a whole.
 *
 * **Two numbers per surface, not one, and that is a correction rather than a refinement.**
 * This map used to pin `failed` alone, and `failed` is not a stable quantity even after
 * `settled` has waited out the fade. Measured on the undo confirmation, ten runs: with the
 * `F-067` filter bar it reported `failed` 11, 10, 11, 11, 10 and without it 9, 10, 10, 10, 10.
 * A single pinned integer therefore goes red on roughly half of all runs while nothing about
 * the panel has changed — which is a test that records nothing.
 *
 * What **is** stable across all ten runs, and across the `F-067` change on all three log
 * surfaces, is `passed` and `failed + undetermined`. The node total never moved; what moved
 * was whether axe could resolve a given node's background at the moment it looked. So the pin
 * is those two, and `notPassing` deliberately adds the two buckets together: `F-035` is
 * precisely the habit of counting `incomplete` as a pass, and this pin refuses to.
 *
 * The cost, stated: a node sliding between `failed` and `undetermined` no longer turns
 * anything red. That is the intent - it is the timing artefact. A node moving in or out of
 * `passed` still does, and that is the only move that means a colour changed.
 *
 * Recorded and not fixed: every one of them is a colour, and `F-034` is already waiting on the
 * same theme pass for `chrome.textDim`.
 */

/** What one dialog's contrast measurement is pinned to. */
interface ContrastTally {
  /** Nodes axe computed a ratio for and found sufficient. */
  passed: number
  /** Nodes it did not: failing plus undetermined, because an unresolved node is not a pass. */
  notPassing: number
}
const KNOWN_CONTRAST: Readonly<Record<string, ContrastTally>> = {
  'the user profile': { passed: 14, notPassing: 9 },
  'the content editor': { passed: 7, notPassing: 1 },
  'the delete-content confirmation': { passed: 3, notPassing: 1 },
  'the lecture editor': { passed: 17, notPassing: 1 },
  'the professor editor': { passed: 12, notPassing: 0 },
  'the delete-lecture confirmation': { passed: 3, notPassing: 1 },
  'the delete-rating confirmation': { passed: 3, notPassing: 1 },
  // The same four tokens the two log detail panels are pinned on, in the same card: this view
  // reuses `DetailSection` and `chrome`'s dim text rather than introducing a colour. `F-038`.
  'the rating details': { passed: 9, notPassing: 4 },
  'the bug report': { passed: 11, notPassing: 4 },
  'the audit detail panel': { passed: 10, notPassing: 10 },
  'the undo confirmation': { passed: 12, notPassing: 12 },
  'the activity detail panel': { passed: 6, notPassing: 7 },
}

/**
 * Controls inside a dialog that nothing names, by surface, as the tags measured.
 *
 * `F-039`, recorded and not fixed. **This list was eleven surfaces long on the first run** —
 * every dialog's close button, because Mantine draws an unlabelled one unless it is given a
 * name, and the jsdom accessibility layer never opens a modal. That and the `Select` clear
 * buttons were one-line theme defaults with no visual effect and are fixed; what is left needs
 * more than a prop.
 *
 * The three per editor are Mantine's own: the two `NumberInput` steppers on Semester year and
 * the `MultiSelect` pill's remove button. `NumberInputProps` exposes no naming prop for the
 * steppers at all — unlike `closeButtonProps` and `clearButtonProps`, which is exactly why
 * those two are fixed and these are not — so naming them means the Styles API or a wrapper
 * around the control, and neither is a change to make without looking at it.
 *
 * Recorded rather than tolerated: an entry that stops being true turns its surface red just as
 * a new one does.
 */
const KNOWN_UNNAMED_IN: Readonly<Record<string, readonly string[]>> = {
  'the lecture editor': ['BUTTON', 'BUTTON', 'BUTTON'],
  'the professor editor': ['BUTTON', 'BUTTON'],
}

/**
 * The only movement `DESIGN.md` §Motion permits anywhere in the panel: the dashboard module
 * card's 2px hover lift. "Nothing else moves, and nothing moves further than this."
 */
const MAX_MOVEMENT = 2

test.describe('every modal', () => {
  for (const surface of SURFACES) {
    test(`${surface.name} opens a dialog with an accessible name`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: HEIGHT })
      await surface.reach(page)

      // The guard that stops this whole file being vacuous: a registry entry whose opener no
      // longer opens anything would make every measurement below run over an empty locator and
      // report the cleanest results in the suite.
      const dialog = page.getByRole('dialog').last()
      await dialog.waitFor()
      await expect(dialog).toHaveAccessibleName(surface.dialogName)
    })

    /**
     * **State** — one dialog, at the moment it is asked to open.
     * **Action** — sample its box every frame until it settles.
     * **Expected** — it does not move.
     *
     * `DESIGN.md` §Motion allows exactly one movement in the panel, the dashboard card's
     * `translateY(-2px)`, and says "nothing else moves, and nothing moves further than this".
     * The tolerance here is that number.
     */
    test(`${surface.name} does not move while it opens`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: HEIGHT })
      await surface.reach(page)
      const dialog = page.getByRole('dialog').last()
      await dialog.waitFor()

      const tops: number[] = []
      for (let frame = 0; frame < 20; frame += 1) {
        const box = await dialog.boundingBox()
        if (box) tops.push(Math.round(box.y))
        await page.waitForTimeout(40)
      }

      const travel = Math.max(...tops) - Math.min(...tops)
      console.log(`motion ${surface.name}: top travelled ${travel}px over ${new Set(tops).size} positions`)
      expect(travel, `${surface.name} slides while opening`).toBeLessThanOrEqual(MAX_MOVEMENT)
    })

    test(`${surface.name} holds focus, closes on Escape and gives focus back`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: HEIGHT })
      await surface.reach(page)
      const dialog = page.getByRole('dialog').last()
      await dialog.waitFor()

      // Tab order is asserted as DOM order only where nothing overrides it. A positive
      // tabindex would make the two differ and the reading below would be a guess.
      expect(await positiveTabIndexes(dialog), `positive tabindex in ${surface.name}`).toEqual([])
      const controls = await controlsIn(dialog)
      const order = tabOrder(controls)
      console.log(`focus ${surface.name}: ${order.length} stops: ${order.join(' → ')}`)
      expect(order.length, `tabbable controls in ${surface.name}`).toBeGreaterThan(0)

      // A control nothing named is announced as "button" and nothing else. Measured here
      // rather than in the jsdom axe layer because that layer never opens a modal.
      expect(unnamed(controls), `unnamed controls in ${surface.name}`).toEqual(
        KNOWN_UNNAMED_IN[surface.name] ?? [],
      )

      const trap = await focusStaysInside(page, dialog)
      expect(trap.inside, `focus after ${trap.tabs} tabs in ${surface.name}`).toBe(true)

      await page.keyboard.press('Escape')

      if (ESCAPE_DOES_NOT_CLOSE[surface.name]) {
        // Recorded, not tolerated: `${ESCAPE_DOES_NOT_CLOSE[surface.name]}` says where. Asserted
        // as *still open*, so this goes red when it starts working just as loudly as it would
        // if another dialog started behaving this way.
        await expect(dialog).toBeVisible()
        return
      }

      await expect(dialog).toBeHidden()

      const focused = await focusedElement(page)
      console.log(`focus ${surface.name}: after Escape → ${focused.tag} "${focused.label ?? ''}"`)
      // Focus dumped on the body strands a keyboard user at the top of the document with no
      // idea where they were. `AdminLayout` already treats that as a defect for its own notice.
      expect(focused.tag, `focus after Escape closes ${surface.name}`).not.toBe('BODY')
      if (surface.openerLabel) {
        expect(focused.label ?? '', `focus returns to what opened ${surface.name}`).toMatch(
          surface.openerLabel,
        )
      }
    })

    for (const width of MEASURABLE_WIDTHS) {
      test(`${surface.name} fits and can be hit at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: HEIGHT })
        await surface.reach(page)
        const dialog = page.getByRole('dialog').last()
        await dialog.waitFor()

        const doc = await pageOverflow(page)
        const body = await overflowOf(dialog)
        const tables = await tableOverflows(dialog)
        const controls = await controlsIn(dialog)
        const small = undersized(controls)

        console.log(
          `surface ${surface.name} @${width}px: page=${doc.needs}/${doc.gets} ` +
            `dialog=${body.needs}/${body.gets} tables=${tables.length} ` +
            `controls=${controls.length} undersized=[${small.join(', ')}]`,
        )

        // A dialog with no controls means `reach` opened something else, or nothing.
        expect(controls.length, `controls in ${surface.name}`).toBeGreaterThan(0)

        // The page behind the modal must not scroll sideways either — an overlay that pushes
        // the document wider is still a document that scrolls.
        // `toBeLessThanOrEqual`, not `toBe`. Overflow is `needs > gets`; equality was only ever a
        // proxy for it, and it held because the page happened to fill its viewport exactly. Since
        // `scrollbar-gutter: stable` the root always reserves the scrollbar's 10px, so a page that
        // does not scroll needs 10 less than it gets - which is the gutter doing its job, not
        // content going missing. Asserting equality here failed on 82 measurements that had
        // nothing wrong with them. `F-062`.
        expect(
          doc.needs,
          `page scroll width behind ${surface.name} at ${width}px`,
        ).toBeLessThanOrEqual(doc.gets)

        const overflow = body.needs - body.gets
        expect(overflow, `${surface.name} overflows at ${width}px`).toBeLessThanOrEqual(
          KNOWN_OVERFLOW_IN[surface.name] ?? 0,
        )

        for (const [index, table] of tables.entries()) {
          if (table.needs > table.gets) {
            expect(
              table.scrollable,
              `table ${index} in ${surface.name} at ${width}px overflows by ${table.needs - table.gets}px and its holder does not scroll`,
            ).toBe(true)
          }
        }

        expect(small, `boxes under ${MIN_TARGET}px in ${surface.name} at ${width}px`).toEqual([
          ...(KNOWN_UNDERSIZED_IN[surface.name] ?? []),
        ])
      })
    }

    test(`${surface.name}: the contrast a real browser can decide`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: HEIGHT })
      await surface.reach(page)
      const dialog = page.getByRole('dialog').last()
      await dialog.waitFor()
      // axe reading a half-faded modal answers differently every run. See `settled`.
      await settled(dialog)

      const results = await new AxeBuilder({ page })
        .include('[role="dialog"]')
        .withRules(['color-contrast'])
        .analyze()
      const contrast = tally(results, 'color-contrast')

      // Reported as three numbers, never two. `F-035` is exactly the habit of counting
      // `incomplete` as a pass, and a modal is painted on a flat surface rather than the
      // gradient — so this is also the measurement that says how much of that finding is the
      // gradient and how much is everything else.
      console.log(
        `contrast ${surface.name}: passed=${contrast.passed} failed=${contrast.failed} ` +
          `undetermined=${contrast.undetermined}`,
      )
      expect(
        { passed: contrast.passed, notPassing: contrast.failed + contrast.undetermined },
        `contrast tally for ${surface.name}`,
      ).toEqual(KNOWN_CONTRAST[surface.name])
    })
  }

  /**
   * The registry is hand-written, so this is what stops it going stale: every route either
   * has a surface above or is named as having none, with a reason. The same partition the
   * call-surface ratchet asserts, for the same reason.
   */
  test('every route is either measured here or exempt with a reason', () => {
    const covered = new Set(SURFACES.map((surface) => surface.route))
    const exempt = new Set(Object.keys(ROUTES_WITHOUT_MODALS))
    const unaccounted = ROUTES.map((route): string => route.name).filter(
      (name) => !covered.has(name) && !exempt.has(name),
    )

    expect(unaccounted, 'routes with neither a measured modal nor a stated reason').toEqual([])
    // And the other direction: an exemption naming a route that no longer exists claims to
    // have considered something that is not on the list.
    const routeNames = new Set<string>(ROUTES.map((route) => route.name))
    expect([...exempt].filter((name) => !routeNames.has(name))).toEqual([])
  })
})

test.describe('every form', () => {
  for (const form of FORMS) {
    test(`${form.name} labels every control it offers`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: HEIGHT })
      await form.reach(page)

      const root = page.locator(form.selector).first()
      await root.waitFor()

      const controls = await controlsIn(root)
      const order = tabOrder(controls)
      console.log(`form ${form.name}: ${order.length} stops: ${order.join(' → ')}`)
      expect(order.length, `controls in ${form.name}`).toBeGreaterThan(0)
      expect(unnamed(controls), `unnamed controls in ${form.name}`).toEqual([])

      const results = await new AxeBuilder({ page })
        .include(form.selector)
        .withRules(['label', 'form-field-multiple-labels', 'select-name', 'aria-input-field-name'])
        .analyze()
      expect(
        results.violations.map((violation) => violation.id),
        `label violations in ${form.name}`,
      ).toEqual([])
    })
  }
})
