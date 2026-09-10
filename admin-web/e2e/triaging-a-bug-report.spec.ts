import { expect, test } from '@playwright/test'
import { signIn } from './signIn'

/**
 * **State** — signed in, two reports in the queue: one open, one reviewed.
 * **Action** — set the open one to "Action Taken".
 * **Expected** — it leaves the queue and appears in the history, and both counts follow.
 *
 * The queue holds open *and* reviewed reports — "reviewed" means looked at, not finished —
 * so closing one moves a single report and leaves the other where it is.
 */
test('closing a bug report moves it from the queue to the history', async ({ page }) => {
  await signIn(page, '/feedback')

  await expect(page.getByRole('tab', { name: 'Queue (2)' })).toBeVisible()
  await page
    .getByRole('button', { name: 'Open bug report: Bewertung lässt sich auf dem Handy nicht abschicken' })
    .click()

  const dialog = page.getByRole('dialog')
  await dialog.getByRole('combobox', { name: 'Status' }).click()
  await page.getByRole('option', { name: 'Action Taken' }).click()
  // The status is fire-and-forget from the select; closing is a separate act.
  await page.keyboard.press('Escape')

  await expect(page.getByRole('tab', { name: 'Queue (1)' })).toBeVisible()
  await page.getByRole('tab', { name: 'History (1)' }).click()
  await expect(
    page.getByText('Bewertung lässt sich auf dem Handy nicht abschicken'),
  ).toBeVisible()
})

/**
 * **State** — signed in, GitLab configured, a report with no issue yet.
 * **Action** — escalate it.
 * **Expected** — the report carries a link to the issue that was opened.
 */
test('escalating a report records the issue it opened', async ({ page }) => {
  await signIn(page, '/feedback')

  await page
    .getByRole('button', { name: 'Open bug report: Bewertung lässt sich auf dem Handy nicht abschicken' })
    .click()

  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Create issue' }).click()

  await expect(dialog.getByRole('link', { name: /Open issue on GitLab/ })).toBeVisible()
})
