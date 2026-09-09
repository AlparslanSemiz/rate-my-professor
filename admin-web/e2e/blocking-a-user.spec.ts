import { expect, test } from '@playwright/test'
import { signIn } from './signIn'

/**
 * Blocking an account and lifting the block, with the boundaries around it.
 *
 * Maps to `E2E-2` and `E2E-3` in `docs/testplan.md` §7. **Neither is closed by this file**, and
 * the reason matters: those two scenarios ask what the *backend* does when an ordinary
 * administrator moderates an administrator, and this suite runs against MSW. What is closed here
 * is the panel's half — the controls it offers, the controls it withholds, and what it shows
 * when the backend refuses anyway.
 *
 * Chromium only, against MSW only. It has never run against the real backend.
 */

/**
 * **State** — signed in, Lena Hoffmann active in the listing.
 * **Action** — open her profile, press Block, confirm.
 * **Expected** — the profile offers Unblock instead, and the listing shows her as blocked.
 *
 * Two records move on one action: the account's status and the row that renders it. A test that
 * checked only the button would pass on a panel that never re-read the list.
 */
test('blocking an account is confirmed, and the listing follows', async ({ page }) => {
  await signIn(page, '/users')

  await page.getByRole('row').filter({ hasText: 'Lena Hoffmann' }).click()
  const profile = page.getByRole('dialog')
  await profile.getByRole('button', { name: 'Block', exact: true }).click()
  await page.getByRole('button', { name: 'Block user' }).click()

  await expect(profile.getByRole('button', { name: 'Unblock', exact: true })).toBeVisible()

  await page.keyboard.press('Escape')
  const row = page.getByRole('row').filter({ hasText: 'Lena Hoffmann' })
  await expect(row.getByText('Blocked')).toBeVisible()
})

/**
 * **State** — signed in, Mira Kowalski already blocked.
 * **Action** — open her profile, press Unblock, confirm.
 * **Expected** — the profile offers Block again, and the listing shows her as active.
 *
 * The other direction, on an account that starts blocked rather than one this suite blocked
 * itself — so the two tests do not depend on each other's order.
 */
test('lifting a block is confirmed, and the listing follows', async ({ page }) => {
  await signIn(page, '/users')

  await page.getByRole('row').filter({ hasText: 'Mira Kowalski' }).click()
  const profile = page.getByRole('dialog')
  await profile.getByRole('button', { name: 'Unblock', exact: true }).click()
  await page.getByRole('button', { name: 'Unblock user' }).click()

  await expect(profile.getByRole('button', { name: 'Block', exact: true })).toBeVisible()

  await page.keyboard.press('Escape')
  const row = page.getByRole('row').filter({ hasText: 'Mira Kowalski' })
  await expect(row.getByText('Active')).toBeVisible()
})

/**
 * **State** — signed in as Alparslan Semiz, looking at his own account.
 * **Action** — open it.
 * **Expected** — no Block, no Warn, no Delete; the profile fields stay editable.
 *
 * Nobody moderates their own account, and the panel does not offer the control rather than
 * offering it and refusing. The edit button staying is the half worth asserting: this is a
 * narrowing, not a read-only profile — `F-003` was exactly that distinction drawn too widely.
 */
test('nobody is offered the controls to moderate their own account', async ({ page }) => {
  await signIn(page, '/users')

  // The row, not the name: the signed-in operator's name is also in the sidebar, and clicking
  // the first match there opens nothing.
  await page.getByRole('row').filter({ hasText: 'Alparslan Semiz' }).click()
  const profile = page.getByRole('dialog')
  await expect(profile).toBeVisible()

  await expect(profile.getByRole('button', { name: 'Block', exact: true })).toBeHidden()
  await expect(profile.getByRole('button', { name: 'Warn', exact: true })).toBeHidden()
  await expect(profile.getByRole('button', { name: 'Delete account' })).toBeHidden()
  await expect(profile.getByRole('button', { name: 'Edit', exact: true })).toBeVisible()
})

/**
 * **State** — signed in, and a backend that refuses the block with `409`.
 * **Action** — block an ordinary student anyway, via `?fault=block-refused`.
 * **Expected** — the backend's own sentence is on screen, and the account is unchanged.
 *
 * The panel withholds the controls for accounts it knows are protected, so this refusal cannot
 * be reached by clicking — which is why it needed a fault to reach at all. What it establishes
 * is the half `E2E-2` cannot ask of MSW: given a refusal, the operator is told what it said
 * rather than a fallback, and nothing on screen pretends the block happened.
 */
test('a refused block says what the backend said, and changes nothing', async ({ page }) => {
  await signIn(page, '/users')
  await page.goto('/users?fault=block-refused')
  await page.getByText(/Everyone who's signed up/).first().waitFor()

  await page.getByRole('row').filter({ hasText: 'Jonas Weber' }).click()
  const profile = page.getByRole('dialog')
  await profile.getByRole('button', { name: 'Block', exact: true }).click()
  await page.getByRole('button', { name: 'Block user' }).click()

  await expect(page.getByText('Administrator accounts cannot be blocked.')).toBeVisible()
  // Still offering Block, because nothing was blocked.
  await expect(profile.getByRole('button', { name: 'Block', exact: true })).toBeVisible()
})
