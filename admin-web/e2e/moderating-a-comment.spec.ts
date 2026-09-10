import { expect, test } from '@playwright/test'
import { signIn } from './signIn'

/**
 * **State** — signed in, a comment reported for insulting a lecturer, still visible.
 * **Action** — move the report to "Action Taken".
 * **Expected** — the report closes and the comment it names is hidden.
 *
 * The rule under test is documented as a decision rather than written in one place:
 * `ACTION_TAKEN` hides content and every other status restores it. It is the one moderation
 * behaviour where the report and the content are different records.
 */
test('hiding reported content closes the report and hides the comment', async ({ page }) => {
  await signIn(page, '/comments')

  await page.getByRole('tab', { name: /Reports/ }).click()
  const status = page.getByRole('combobox', { name: 'Status for report by Mira Kowalski' })
  await status.click()
  await page.getByRole('option', { name: 'Action Taken' }).click()

  await expect(status).toHaveValue('Action Taken')

  await page.getByRole('tab', { name: /All comments/ }).click()
  const row = page.getByLabel('Edit comment by Mira Kowalski')
  await expect(row.getByText('Hidden')).toBeVisible()
})

/**
 * **State** — signed in, a comment whose text needs correcting.
 * **Action** — open the row, rewrite the text, save.
 * **Expected** — the table shows the corrected text, having re-read it.
 */
test('correcting a comment shows the text the backend now holds', async ({ page }) => {
  await signIn(page, '/comments')

  await page.getByRole('button', { name: 'Edit content by Jonas Weber' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('textbox', { name: 'Text' }).fill('Skript ist veraltet - Stand 2019.')
  await dialog.getByRole('button', { name: 'Save changes' }).click()

  // Wait for the dialog to go before looking for the text, and then look for it **in the
  // table**. The unscoped locator matched two nodes - the table cell and the dialog's own
  // textarea, which holds the same string - so it only ever passed while the modal happened to
  // have finished animating out first. Hoisting the stat cards above the tab strip (`F-065`)
  // added a re-render that changed that timing and turned the latent ambiguity into a failure.
  // The modal does close: `ContentEditModal` calls `onClose()` after a successful save.
  await expect(dialog).toBeHidden()
  await expect(
    page.getByRole('tabpanel').getByText('Skript ist veraltet - Stand 2019.'),
  ).toBeVisible()
})

/**
 * **State** — signed in, a thread with one answer under a comment.
 * **Action** — search for text that appears only in the answer.
 * **Expected** — the answer is found and shown under its parent, which does not match itself.
 */
test('a search finds an answer and reveals it under its comment', async ({ page }) => {
  await signIn(page, '/comments')

  await page.getByRole('textbox', { name: 'Search comments' }).fill('Tutorium')

  await expect(page.getByText(/Das Tutorium von Frau Brandenburger/)).toBeVisible()
})
