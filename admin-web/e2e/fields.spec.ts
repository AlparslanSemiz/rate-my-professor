/// <reference lib="dom" />
// `tsconfig.e2e.json` leaves `DOM` out of `lib` on purpose: a spec runs in Node and drives a
// browser, so a top-level `document` should not compile. The bodies of `page.evaluate` are the
// exception — they are serialised and run *in the page*, so they are browser code living in a
// Node file, and TypeScript cannot tell the two apart. The reference is per-file rather than in
// the shared config so the guard still holds for every other spec.

import { expect, test, type Locator, type Page } from '@playwright/test'
import { HEIGHT } from './measure'
import { signIn } from './signIn'

/**
 * The panel's five multi-line boxes, and whether they show what is in them.
 *
 * Nothing measured these before. `surfaces.spec.ts` opens the dialogs and measures the dialog;
 * a field *inside* one that hides half its value is the right size box drawn around the wrong
 * amount of text, and every measurement in that file passes while it happens.
 *
 * The widths are 1440 and 1024, and they are the same run twice on purpose: a textarea in a
 * fixed-width dialog does not change size with the viewport, so a difference between the two
 * would itself be news.
 *
 * Chromium only, against MSW only.
 */

/** The two desktop widths. A dialog is fixed-width, so these agree unless something is wrong. */
const WIDTHS = [1440, 1024]

/**
 * The longest string the fixtures contain, copied from `src/test/msw/browser.ts`'s
 * `long-content` fault.
 *
 * Real German course prose rather than a repeated character, for the reason that fault gives:
 * a run of `x` wraps differently from a word, and it is wrapping that decides a box's height.
 * It needs about four and a half lines in these fields, which is deliberately **inside** the
 * cap — a field that stops at the cap is doing its job, and a test that could not tell the two
 * apart would pass on either.
 */
const LONG_TEXT =
  'Die Vorlesung Grundlagen der Programmierung mit begleitendem Tutorium und Rechnerübung ' +
  'behandelt Datenstrukturen, Algorithmen und Softwaretechnik im Wintersemester und wird ' +
  'gemeinsam von mehreren Lehrstühlen des KIT angeboten, weshalb die Beschreibung so lang ist.'

/** One multi-line field, the shortest honest path to it, and the floor it declares. */
interface MultilineField {
  readonly name: string
  /** Signs in, navigates, and opens whatever the field lives in. */
  readonly reach: (page: Page) => Promise<void>
  readonly field: (page: Page) => Locator
  /** The `minRows` its call site asks for. Asserted, because asking for it is not getting it. */
  readonly minRows: number
}

export const MULTILINE_FIELDS: readonly MultilineField[] = [
  {
    name: 'the comment editor',
    reach: async (page) => {
      await page.goto('/comments')
      await page.getByText(/Every comment in the app/).first().waitFor()
      await page.getByRole('button', { name: /^Edit content by / }).first().click()
      await page.getByRole('dialog').waitFor()
    },
    field: (page) => page.getByRole('dialog').getByLabel('Text'),
    minRows: 5,
  },
  {
    name: 'the bug report description',
    reach: async (page) => {
      await page.goto('/feedback')
      await page.getByText(/Bug reports and crash logs/).first().waitFor()
      await page.getByRole('button', { name: /^Open bug report: / }).first().click()
      const dialog = page.getByRole('dialog')
      await dialog.waitFor()
      await dialog.getByRole('button', { name: 'Edit', exact: true }).click()
    },
    field: (page) => page.getByRole('dialog').getByLabel('Description'),
    minRows: 4,
  },
  {
    name: 'the warning form',
    reach: async (page) => {
      await openLenasProfile(page)
      await page.getByRole('dialog').getByRole('button', { name: 'Warn', exact: true }).click()
    },
    field: (page) => page.getByRole('dialog').getByLabel('Warning message'),
    minRows: 3,
  },
  {
    name: 'the biography',
    reach: async (page) => {
      await openLenasProfile(page)
      await page.getByRole('dialog').getByRole('button', { name: 'Edit', exact: true }).click()
    },
    field: (page) => page.getByRole('dialog').getByLabel('Biography'),
    minRows: 2,
  },
  {
    name: 'the warning editor',
    reach: async (page) => {
      await openLenasProfile(page)
      await page.getByRole('dialog').getByRole('button', { name: 'Edit warning' }).first().click()
    },
    field: (page) => page.getByRole('dialog').getByLabel('Warning message'),
    minRows: 2,
  },
] as const

/** The one profile with a warning already in its history, which two of the fields need. */
async function openLenasProfile(page: Page): Promise<void> {
  await page.goto('/users')
  await page.getByText(/Everyone who's signed up/).first().waitFor()
  await page.getByRole('row', { name: 'Open the profile of Lena Hoffmann' }).click()
  await page.getByRole('dialog').waitFor()
}

/** What a text box is showing against what it holds. */
interface Box {
  /** Rows of text the box shows, its own padding included, so a floor of `n` reads above `n`. */
  rows: number
  /** How much taller the content is than the box. Zero means nothing is hidden. */
  hidden: number
  characters: number
}

/** @param field a textarea @returns what it shows against what it holds */
async function boxOf(field: Locator): Promise<Box> {
  return field.evaluate((node: HTMLTextAreaElement) => {
    const lineHeight =
      parseFloat(getComputedStyle(node).lineHeight) ||
      parseFloat(getComputedStyle(node).fontSize) * 1.2
    return {
      rows: Math.round((node.clientHeight / lineHeight) * 10) / 10,
      hidden: Math.max(0, Math.round(node.scrollHeight - node.clientHeight)),
      characters: node.value.length,
    }
  })
}

/**
 * @returns how tall the document behind the dialog is
 *
 * Read as a *delta* rather than against the viewport, and the difference matters: Users at
 * 1024px is 963px tall before anything is opened, because its table wraps. Asserting the page
 * simply never scrolls would fail on that and say nothing about the field.
 */
async function documentHeight(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollHeight)
}

for (const width of WIDTHS) {
  for (const spec of MULTILINE_FIELDS) {
    /**
     * **State** — one multi-line field, open, holding whatever the fixture gave it.
     * **Action** — measure the box against its content, then type the longest fixture string
     *              into it and measure again.
     * **Expected** — the box is at least as tall as the `minRows` its call site asks for, and
     *                neither value is cut off.
     */
    test(`${spec.name} shows what it holds at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT })
      await signIn(page, '/dashboard')
      await spec.reach(page)

      const field = spec.field(page)
      await field.waitFor()

      // Asking for `minRows` is not getting it: Mantine drops the prop unless `autosize` is
      // set, so this reads the floor the call site declared rather than assuming it applies.
      const heightBefore = await documentHeight(page)
      const seeded = await boxOf(field)
      console.log(`field ${spec.name} @${width}px seeded: ${seeded.rows} rows, ${seeded.hidden}px hidden, ${seeded.characters} chars`)
      expect(seeded.rows, `${spec.name} declares minRows=${spec.minRows}`).toBeGreaterThanOrEqual(
        spec.minRows,
      )
      expect(seeded.hidden, `${spec.name} hides part of its seeded value`).toBe(0)

      await field.fill(LONG_TEXT)
      const filled = await boxOf(field)
      console.log(`field ${spec.name} @${width}px filled: ${filled.rows} rows, ${filled.hidden}px hidden, ${filled.characters} chars`)
      expect(filled.characters, `${spec.name} took the long value`).toBe(LONG_TEXT.length)
      expect(filled.hidden, `${spec.name} hides part of the longest fixture text`).toBe(0)

      // A field that grows by pushing the page taller has moved the problem rather than fixed
      // it. The dialog carries its own `max-height` and scrolls internally, so the document
      // behind it should be exactly as tall as it was before a word was typed.
      expect(
        await documentHeight(page),
        `the page behind ${spec.name} grew while the field did`,
      ).toBe(heightBefore)
    })
  }
}
