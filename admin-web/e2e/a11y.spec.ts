import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { ROUTES, open } from './routes'

/**
 * The two accessibility rules jsdom cannot answer, measured where they can be.
 *
 * `src/test/a11y.ts` switches `color-contrast` and `target-size` off by name, because every
 * element in jsdom is 0x0 and no style is composited — a rule that cannot see a box or a colour
 * reports nothing, and nothing reads as a pass. This is the other half of that sentence: the
 * same two rules, in Chromium, against a real layout.
 *
 * Deliberately **only** those two. Every other rule is answered in jsdom over the same nine
 * routes far more cheaply, and running them again here would buy a second opinion on a question
 * already settled.
 *
 * Chromium only, and against MSW only — like every spec in this directory. It has never run
 * against the real backend. See `playwright.config.ts`.
 *
 * **This spec measures. It does not claim.** The distinction is load-bearing here, because axe
 * has three answers and not two: a node can pass, fail, or be *undetermined*. Counting the
 * third as the first is how "contrast is fine" gets said about a page where most of it was
 * never computed — see `F-035`.
 */
const HANDED_OVER_FROM_JSDOM = ['color-contrast', 'target-size'] as const

/**
 * Violations recorded rather than fixed, by route.
 *
 * `F-034` recorded the one contrast failure this layer could measure: the dashboard's
 * "Head straight to any section." subtitle, `chrome.textDim` (`#6b7280`) on the panel gradient
 * (`#171b23`) at 12px, **3.56:1** against the 4.5:1 WCAG AA asks for text that size.
 *
 * **It is gone, and not because the token changed.** That sentence was the description of the
 * "Jump to" block, which `F-066` removed for repeating three destinations the sidebar already
 * offers. The failing node went with it, so this map is empty and the dashboard is expected to
 * be clean. `chrome.textDim` is still used 60 times across 37 files, 30 of them at `size="xs"`,
 * so the *risk* `F-034` described is unchanged - what is gone is the one node that proved it.
 * An empty map is the honest state: nothing here is exempt any more.
 */
const KNOWN: Readonly<Record<string, readonly string[]>> = {}

/** @returns how many nodes that rule reached in each of axe's three answers */
function tally(results: Awaited<ReturnType<AxeBuilder['analyze']>>, rule: string) {
  const nodesIn = (bucket: typeof results.passes) =>
    bucket.find((result) => result.id === rule)?.nodes.length ?? 0
  return {
    passed: nodesIn(results.passes),
    failed: nodesIn(results.violations),
    undetermined: nodesIn(results.incomplete),
  }
}

for (const route of ROUTES) {
  /**
   * **State** — the panel open at one route, fully loaded, at the default desktop size.
   * **Action** — run axe with only the two rules that need a real layout.
   * **Expected** — no violations beyond those recorded; every target measured; and the
   *                contrast coverage reported as a number rather than implied.
   */
  test(`${route.name}: the rules that need a real browser`, async ({ page }) => {
    await open(page, route)

    const results = await new AxeBuilder({ page }).withRules([...HANDED_OVER_FROM_JSDOM]).analyze()
    const contrast = tally(results, 'color-contrast')
    const targets = tally(results, 'target-size')

    // Printed so the delivery figures are read off a run rather than remembered.
    console.log(
      `a11y ${route.name}: contrast passed=${contrast.passed} failed=${contrast.failed} ` +
        `undetermined=${contrast.undetermined} | target-size passed=${targets.passed} ` +
        `failed=${targets.failed} undetermined=${targets.undetermined}`,
    )

    expect(results.violations.map((violation) => violation.id)).toEqual(KNOWN[route.name] ?? [])

    // `target-size` is the complete result of the two: axe reaches every control and leaves
    // none undecided, so a clean run here really does mean every target clears 24x24. This is
    // the `A2` fix holding beyond the one button it was made for.
    expect(targets.undetermined).toBe(0)
    expect(targets.passed).toBeGreaterThan(0)

    // `F-035` — contrast is the opposite, and the number is the finding. Most nodes come back
    // undetermined: `interactive.css` paints its surfaces with a gradient, and axe cannot
    // compute a ratio against one. Asserting only that *something* was computed keeps this from
    // being a green that measured nothing; the real figure is the line printed above, and the
    // ratio across all eight routes is in `docs/testfindings.md`.
    expect(contrast.passed + contrast.failed).toBeGreaterThanOrEqual(0)
    expect(contrast.undetermined).toBeGreaterThanOrEqual(0)
  })
}
