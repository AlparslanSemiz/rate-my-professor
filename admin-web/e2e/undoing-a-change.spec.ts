import { expect, test } from '@playwright/test'
import { signIn } from './signIn'

/**
 * **State** — signed in, an audit entry recording a credibility score changed from 80 to 72.
 * **Action** — open the entry and undo it.
 * **Expected** — the entry reports itself as undone, and the button is no longer offered.
 *
 * The undo is the panel's only destructive-in-reverse action, and the backend refuses it for
 * five different reasons. This is the path where it succeeds; the refusals are covered where
 * they can be provoked, in `AuditLogsPage.integration.test.tsx`.
 */
test('undoing a field edit records the reversal and stops offering it again', async ({ page }) => {
  await signIn(page, '/audit-logs')

  await page.getByLabel('Open audit event User Updated by Alparslan Semiz').click()

  const details = page.getByRole('dialog')
  await expect(details.getByText('80')).toBeVisible()
  await expect(details.getByText('72')).toBeVisible()

  await details.getByRole('button', { name: 'Undo this change' }).click()
  const confirmation = page.getByRole('dialog', { name: 'Undo this change' })
  await confirmation.getByRole('button', { name: 'Undo the change' }).click()

  await expect(page.getByRole('button', { name: 'Undo this change' })).toBeHidden()
})

/**
 * **State** — signed in, an audit entry for a sign-in.
 * **Action** — open it.
 * **Expected** — no undo button, and the backend's reason in words an operator can act on.
 */
test('a sign-in offers no undo, and says why', async ({ page }) => {
  await signIn(page, '/audit-logs')

  await page.getByLabel('Open audit event Admin Login by Alparslan Semiz').click()

  const details = page.getByRole('dialog')
  await expect(details.getByRole('button', { name: 'Undo this change' })).toBeHidden()
  await expect(details.getByText(/not a field edit/)).toBeVisible()
})

/**
 * **State** — signed in, three audit entries by one actor.
 * **Action** — search for a target that appears in one of them.
 * **Expected** — the filter is applied by the backend and the list narrows.
 */
test('the audit log filters on the backend', async ({ page }) => {
  await signIn(page, '/audit-logs')

  await page.getByRole('textbox', { name: 'Search' }).fill('Mira')
  await page.getByRole('button', { name: 'Apply filters' }).click()

  await expect(page.getByText(/Mira Kowalski/).first()).toBeVisible()
  await expect(page.getByText(/Lena Hoffmann/)).toBeHidden()
})
