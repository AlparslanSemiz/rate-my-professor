/// <reference lib="dom" />
// `tsconfig.e2e.json` leaves `DOM` out of `lib` on purpose: a spec runs in Node and drives a
// browser, so a top-level `document` should not compile. The bodies of `page.evaluate` are the
// exception — they are serialised and run *in the page*, so they are browser code living in a
// Node file, and TypeScript cannot tell the two apart. The reference is per-file rather than in
// the shared config so the guard still holds for every other spec.

import type { Locator, Page } from '@playwright/test'
import type AxeBuilder from '@axe-core/playwright'

/**
 * The measurements the browser layer takes, written once.
 *
 * Every one of these was an inline `page.evaluate` in whichever spec needed it, which was
 * tolerable while three specs measured eight routes and stopped being so once the same
 * questions had to be asked inside every modal as well. Two copies of "does it overflow"
 * drifting apart would not fail anything — they would just answer differently.
 *
 * **Nothing here asserts.** These return numbers and the spec decides what they mean, because
 * the whole layer exists to report figures rather than to pronounce on them.
 */

/** WCAG 2.2 SC 2.5.8, and the number `A2` applied to `ErrorAlert`'s dismiss button. */
export const MIN_TARGET = 24

/**
 * Widths the panel can actually be measured at.
 *
 * 1024 and 1440 are the desktop sizes the panel is used at. 800 is here because
 * `layout.spec.ts` pins it as the *first* width at which the navbar is 240px rather than the
 * whole viewport — below it there is nothing on screen to measure, which is `F-019`.
 */
export const MEASURABLE_WIDTHS = [800, 1024, 1440]
export const HEIGHT = 900

/** What counts as interactive, and what of it the browser will stop at on Tab. */
const SELECTORS = {
  interactive: 'button, a[href], [role="button"], input:not([type="hidden"]), select, textarea',
  tabbable:
    'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
} as const

/** What a box has to hold against what it was given. Equal means nothing overflowed. */
export interface Overflow {
  needs: number
  gets: number
  /** Whether the holder scrolls, which is what makes an overflow a cost rather than a loss. */
  scrollable: boolean
}

/** @returns the document's own horizontal overflow, which is the bluntest failure there is */
export async function pageOverflow(page: Page): Promise<Overflow> {
  return page.evaluate(() => ({
    needs: document.documentElement.scrollWidth,
    gets: document.documentElement.clientWidth,
    scrollable: true,
  }))
}

/**
 * @param root anything with a box — a dialog, a panel, a table
 * @returns what its content needs against what it gets, and whether it may scroll for it
 */
export async function overflowOf(root: Locator): Promise<Overflow> {
  return root.evaluate((node) => ({
    needs: node.scrollWidth,
    gets: node.clientWidth,
    scrollable: getComputedStyle(node).overflowX !== 'visible',
  }))
}

/**
 * @param root the page's `body`, or a dialog
 * @returns every table inside it, measured against the box it is drawn in
 */
export async function tableOverflows(root: Locator): Promise<Overflow[]> {
  return root.evaluate((node) =>
    [...node.querySelectorAll('table')].map((table) => {
      const holder = table.parentElement
      return {
        needs: table.scrollWidth,
        gets: holder?.clientWidth ?? 0,
        scrollable: holder ? getComputedStyle(holder).overflowX !== 'visible' : false,
      }
    }),
  )
}

/** One interactive control, measured and named, as one browser-side pass reports it. */
export interface Control {
  width: number
  height: number
  /** The accessible name, or an empty string when nothing named it. */
  name: string
  tag: string
  /** Whether the browser will stop at it on Tab. */
  tabbable: boolean
}

/**
 * Every interactive control inside `root`, measured and named in one pass.
 *
 * **One pass rather than three, and the reason is a mistake this made.** The name, the box and
 * the tab order started as three separate `evaluate` calls, each with its own idea of what a
 * control's name is — the first read `aria-label` and nothing else, so every
 * `<label>`-associated input in the panel came back nameless and the first run reported a
 * dozen unnamed controls that are in fact labelled. A function cannot be passed into an
 * `evaluate` body, since arguments are serialised, so the only way to have one definition of
 * "named" is to have one call.
 *
 * The naming follows the accessible-name spec's ordering as far as this panel uses it:
 * `aria-labelledby`, `aria-label`, an associated `<label>`, `title`, `placeholder`, own text.
 * It resolves no `aria-labelledby` chains and no CSS-generated content, so an empty name here
 * means "named by none of those six", not "unnameable".
 *
 * **Interactive is wider than `<button>`, which is what the first version measured.** That is
 * why `F-037` names exactly one link: the dashboard's `See everyone →` was found by eye, not by
 * the sweep, because the sweep never looked at anchors.
 *
 * `offsetParent !== null` drops what is not laid out — and also anything `position: fixed`,
 * which is why a modal is measured through its own locator rather than through the page.
 */
export async function controlsIn(root: Locator): Promise<Control[]> {
  return root.evaluate((node, selectors) => {
    const nameOf = (element: Element): string => {
      const byId = element.getAttribute('aria-labelledby')
      if (byId) {
        const target = element.ownerDocument.getElementById(byId.split(' ')[0])
        const text = target?.textContent?.trim()
        if (text) return text
      }
      const aria = element.getAttribute('aria-label')?.trim()
      if (aria) return aria
      const labels = (element as HTMLInputElement).labels
      if (labels && labels.length > 0) {
        const text = [...labels]
          .map((label) => label.textContent?.trim() ?? '')
          .join(' ')
          .trim()
        if (text) return text
      }
      const title = element.getAttribute('title')?.trim()
      if (title) return title
      const placeholder = element.getAttribute('placeholder')?.trim()
      if (placeholder) return placeholder
      return element.textContent?.trim() ?? ''
    }

    return [...node.querySelectorAll(selectors.interactive)]
      .filter((element) => (element as HTMLElement).offsetParent !== null)
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          name: nameOf(element).slice(0, 40),
          tag: element.tagName,
          tabbable: element.matches(selectors.tabbable),
        }
      })
  }, SELECTORS)
}

/** @returns the distinct `WxH` boxes under {@link MIN_TARGET}, sorted, which is how they are pinned */
export function undersized(controls: Control[]): string[] {
  return [
    ...new Set(
      controls
        .filter((control) => control.width < MIN_TARGET || control.height < MIN_TARGET)
        .map((control) => `${control.width}x${control.height}`),
    ),
  ].sort()
}

/**
 * @returns the accessible name of each tabbable control, in DOM order
 *
 * DOM order, not the order the browser will actually visit: a positive `tabindex` would
 * reorder it. {@link positiveTabIndexes} is asserted empty wherever this is read, so the two
 * being the same thing is established rather than assumed.
 */
export function tabOrder(controls: Control[]): string[] {
  return controls.filter((control) => control.tabbable).map((control) => control.name)
}

/**
 * @returns the tag of every tabbable control that nothing named
 *
 * A control with no accessible name is announced as "button" and nothing else, which tells the
 * operator what it is and not what it does.
 */
export function unnamed(controls: Control[]): string[] {
  return controls
    .filter((control) => control.tabbable && control.name === '')
    .map((control) => control.tag)
}

/** @returns every positive `tabindex` inside `root`; a non-empty result means DOM order is a lie */
export async function positiveTabIndexes(root: Locator): Promise<number[]> {
  return root.evaluate((node) =>
    [...node.querySelectorAll('[tabindex]')]
      .map((element) => Number(element.getAttribute('tabindex')))
      .filter((value) => value > 0),
  )
}

/**
 * Tabs one step past the last control in the dialog and reports where focus ended up.
 *
 * Counting rather than guessing is the difference between measuring a trap and measuring a
 * dialog that happens to be long.
 *
 * @returns whether focus is still inside, and how many tabs it took to find out
 */
export async function focusStaysInside(
  page: Page,
  dialog: Locator,
): Promise<{ inside: boolean; tabs: number }> {
  const stops = tabOrder(await controlsIn(dialog))
  for (let step = 0; step <= stops.length; step += 1) {
    await page.keyboard.press('Tab')
  }
  const inside = await dialog.evaluate((node) => {
    const active = node.ownerDocument.activeElement
    return active !== null && node.contains(active)
  })
  return { inside, tabs: stops.length + 1 }
}

/** Where focus is, in the two terms an assertion can be written against. */
export interface FocusedElement {
  tag: string
  label: string | null
}

/** @returns the focused element's tag and accessible name, or `BODY` when focus was dropped */
export async function focusedElement(page: Page): Promise<FocusedElement> {
  return page.evaluate(() => ({
    tag: document.activeElement?.tagName ?? 'NONE',
    label:
      document.activeElement?.getAttribute('aria-label') ??
      document.activeElement?.textContent?.trim().slice(0, 40) ??
      null,
  }))
}

/**
 * Waits until a dialog has finished animating in.
 *
 * Mantine fades and scales a modal on open, and axe reading a half-faded surface answers
 * differently every run — the content editor's contrast came back `3 passed / 0 failed / 5
 * undetermined` on one run and `7 / 1 / 0` on the next, from the same page. A measurement that
 * changes when nothing changed is not a measurement, and pinning either number would have
 * produced a test that failed at random.
 *
 * @param dialog the dialog to wait for
 */
export async function settled(dialog: Locator): Promise<void> {
  await dialog.evaluate(
    (node) =>
      new Promise<void>((resolve) => {
        const done = () =>
          getComputedStyle(node).opacity === '1' && node.getAnimations().length === 0
        if (done()) {
          resolve()
          return
        }
        const timer = setInterval(() => {
          if (done()) {
            clearInterval(timer)
            resolve()
          }
        }, 50)
      }),
  )
}

/**
 * axe has **three** answers, not two.
 *
 * Counting `incomplete` as a pass is how "contrast is fine" gets said about a page where most
 * of it was never computed. `F-035` is that number: 361 of 407 nodes come back undetermined
 * because the panel's surfaces are painted with a gradient axe cannot resolve.
 *
 * @returns how many nodes the rule reached in each of the three
 */
export function tally(results: Awaited<ReturnType<AxeBuilder['analyze']>>, rule: string) {
  const nodesIn = (bucket: typeof results.passes) =>
    bucket.find((result) => result.id === rule)?.nodes.length ?? 0
  return {
    passed: nodesIn(results.passes),
    failed: nodesIn(results.violations),
    undetermined: nodesIn(results.incomplete),
  }
}
