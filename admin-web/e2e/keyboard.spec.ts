/// <reference lib="dom" />
// `tsconfig.e2e.json` leaves `DOM` out of `lib` on purpose: a spec runs in Node and drives a
// browser, so a top-level `document` should not compile. The bodies of `page.evaluate` are the
// exception — they are serialised and run *in the page*, so they are browser code living in a
// Node file, and TypeScript cannot tell the two apart. The reference is per-file rather than in
// the shared config so the guard still holds for every other spec.

import { expect, test, type Page } from '@playwright/test'
import { HEIGHT } from './measure'

/**
 * The panel driven with no mouse at all.
 *
 * **There is not one `click()` in this file, and that is the whole point.** Every other spec
 * clicks, so every other spec proves the panel works for someone who can. The accessibility
 * layer asserts that focus *lands* somewhere reachable; this asks the different and harder
 * question of whether an operator can get from signing in to a finished moderation decision
 * using only Tab, the arrow keys and Enter.
 *
 * Nothing had ever driven the panel this way. Where it gets stuck, the number of presses and
 * the control it stalled on are printed and the finding is opened — a run that is merely green
 * is worth much less here than one that says how far it got.
 *
 * Chromium only, against MSW only.
 */

const WIDTH = 1440
/** Enough presses to cross any screen in this panel; a loop that hits it has found something. */
const MAX_PRESSES = 60

/** @returns the focused element's accessible name, or its tag when nothing named it */
async function focusName(page: Page): Promise<string> {
  return page.evaluate(() => {
    const active = document.activeElement
    if (!active) return 'NONE'
    // Focus resting on the document itself, which is where a tab cycle wraps. Reported by name
    // rather than by its text, which would otherwise be the whole Mantine stylesheet.
    if (active === document.body || active === document.documentElement) return active.tagName
    const aria = active.getAttribute('aria-label')?.trim()
    if (aria) return aria
    const labels = (active as HTMLInputElement).labels
    if (labels && labels.length > 0) {
      const text = [...labels].map((label) => label.textContent?.trim() ?? '').join(' ').trim()
      if (text) return text
    }
    const placeholder = active.getAttribute('placeholder')?.trim()
    if (placeholder) return placeholder
    return active.textContent?.trim().slice(0, 45) || active.tagName
  })
}

/**
 * Tabs until the focused control's name matches, and reports how many presses it took.
 *
 * @param page the page
 * @param name what to stop at
 * @param label what to call it if this has to fail
 * @returns the number of Tab presses spent
 * @throws when {@link MAX_PRESSES} is reached, naming what was focused instead — the message
 *         is the finding, so it says where the keyboard run actually stalled
 */
async function tabTo(page: Page, name: RegExp, label: string): Promise<number> {
  const seen: string[] = []
  for (let presses = 1; presses <= MAX_PRESSES; presses += 1) {
    await page.keyboard.press('Tab')
    const focused = await focusName(page)
    seen.push(focused)
    if (name.test(focused)) {
      console.log(`keyboard: reached ${label} in ${presses} presses`)
      return presses
    }
  }
  throw new Error(
    `never reached ${label} in ${MAX_PRESSES} tab presses. Focus visited: ${seen.join(' → ')}`,
  )
}

/**
 * Signs in without touching the mouse, which is also the first thing this file establishes.
 *
 * **The email has to be typed before the button can be tabbed to**, and that is not a
 * workaround — it is what the screen does. Until the address is valid, `Send me a code` is
 * `disabled`, so the browser skips it and the whole sign-in screen has exactly *one* tab stop.
 * Written the other way round, this loop tabbed sixty times between the document and the email
 * field, which is how the one-stop fact was found in the first place. A disabled control being
 * skipped is correct behaviour; a keyboard operator meeting it just has to type first.
 */
async function signInByKeyboard(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.getByPlaceholder('admin@student.kit.edu').waitFor()

  await tabTo(page, /^Email/, 'the email field')
  await page.keyboard.type('unzhz@student.kit.edu')
  await tabTo(page, /Send me a code/, 'the send-code button')
  await page.keyboard.press('Enter')

  await page.getByPlaceholder('Code from your email').waitFor()
  await tabTo(page, /^(Code|Login code)/, 'the code field')
  await page.keyboard.type('123456')
  await tabTo(page, /^Sign in$/, 'the sign-in button')
  await page.keyboard.press('Enter')

  await page.waitForURL(new RegExp(`${path}$`))
}

test('an operator can sign in with no mouse at all', async ({ page }) => {
  await page.setViewportSize({ width: WIDTH, height: HEIGHT })
  await signInByKeyboard(page, '/dashboard')

  await expect(page.getByText(/A quick look at how your community's doing today/)).toBeVisible()
})

/**
 * **State** — signed in, on the users table, mouse untouched.
 * **Action** — tab to a student's row, open it with Enter, tab to Block, confirm.
 * **Expected** — the listing shows the account blocked afterwards.
 *
 * The row is a `ClickableRow`, so this is also the keyboard half of `F-008`: the row has to
 * take Enter itself here, where in `focus.spec.ts` a control *inside* a row has to keep its own.
 */
test('a user can be blocked without a mouse', async ({ page }) => {
  await page.setViewportSize({ width: WIDTH, height: HEIGHT })
  await signInByKeyboard(page, '/users')
  await page.getByText(/Everyone who's signed up/).waitFor()

  await tabTo(page, /^Open the profile of Lena Hoffmann$/, "an active student's row")
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  await tabTo(page, /^Block$/, 'the block control')
  await page.keyboard.press('Enter')

  const confirmation = page.getByRole('dialog').last()
  await expect(confirmation).toHaveAccessibleName(/Block/)
  await tabTo(page, /^Block user$/, 'the confirm button')
  await page.keyboard.press('Enter')

  // The confirmation closes and the profile stays open, which is what the panel does after a
  // block: the operator is still looking at the account they just acted on.
  await expect(page.getByRole('dialog', { name: 'Block user' })).toBeHidden()
  await expect(page.getByRole('dialog', { name: 'User Profile' })).toBeVisible()

  // The control flipping to Unblock is the panel reporting the backend's answer, not its own
  // optimism — the profile is re-read after the write.
  await expect(dialog.getByRole('button', { name: 'Unblock' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(
    page.getByRole('row', { name: /Open the profile of Lena Hoffmann/ }).getByText('Blocked'),
  ).toBeVisible()
})

/**
 * **State** — signed in, on the comments table, mouse untouched.
 * **Action** — tab to a row's edit control, open the editor, change visibility to Hidden, save.
 * **Expected** — the row reads Hidden afterwards.
 */
test('a comment can be hidden without a mouse', async ({ page }) => {
  await page.setViewportSize({ width: WIDTH, height: HEIGHT })
  await signInByKeyboard(page, '/comments')
  await page.getByText(/Every comment in the app/).waitFor()

  await tabTo(page, /^Edit content by /, "a row's edit control")
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  await tabTo(page, /^Visibility$/, 'the visibility field')
  // A Mantine `Select` is a combobox: the arrow keys move through its options and Enter takes
  // the highlighted one. Typing the value would not test the control an operator actually uses.
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Enter')
  await expect(dialog.getByRole('combobox', { name: 'Visibility' })).toHaveValue('Hidden')

  await tabTo(page, /^Save changes$/, 'the save button')
  await page.keyboard.press('Enter')

  await expect(page.getByRole('dialog')).toBeHidden()
})

/**
 * **State** — signed in, on the audit log, mouse untouched.
 * **Action** — tab to a revertible entry, open it, undo it, confirm.
 * **Expected** — the entry stops offering the undo.
 *
 * The only flow in the panel that changes a record through two stacked dialogs, so it is the
 * one most likely to strand a keyboard operator between them.
 */
test('an audit entry can be undone without a mouse', async ({ page }) => {
  await page.setViewportSize({ width: WIDTH, height: HEIGHT })
  await signInByKeyboard(page, '/audit-logs')
  await page.getByText(/A trace of successful admin actions/).waitFor()

  await tabTo(page, /^Open audit event User Updated/, 'a revertible entry')
  await page.keyboard.press('Enter')

  await page.getByRole('dialog').waitFor()
  await tabTo(page, /^Undo this change$/, 'the undo control')
  await page.keyboard.press('Enter')

  await expect(page.getByRole('dialog').last()).toHaveAccessibleName('Undo this change')
  await tabTo(page, /^Undo the change$/, 'the confirm button')
  await page.keyboard.press('Enter')

  await expect(page.getByRole('dialog')).toBeHidden()
  await page.getByRole('row', { name: /^Open audit event User Updated/ }).first().press('Enter')
  const reopened = page.getByRole('dialog')
  await reopened.waitFor()
  await expect(reopened.getByRole('button', { name: 'Undo this change' })).toBeHidden()
  await expect(reopened.getByText(/This change has been undone/)).toBeVisible()
})
