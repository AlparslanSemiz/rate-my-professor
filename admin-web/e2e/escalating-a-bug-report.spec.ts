import { expect, test } from '@playwright/test'
import { signIn } from './signIn'

/**
 * Escalating a bug report into a GitLab issue, and what happens when GitLab is not there.
 *
 * Maps to `E2E-9` in `docs/testplan.md` §7, whose note reads "enabled path covered; the `503`
 * stays with `P2`". The enabled path is covered by `e2e/triaging-a-bug-report.spec.ts` and is
 * deliberately not repeated here. What this adds is the **unconfigured** half, which is the one
 * most deployments actually run in: the integration needs credentials the backend may not have.
 *
 * Chromium only, against MSW only. It has never run against the real backend.
 */

const OPEN_REPORT = 'Open bug report: Bewertung lässt sich auf dem Handy nicht abschicken'

/**
 * **State** — signed in, GitLab configured, a report with no issue yet.
 * **Action** — escalate it, close the report, and open it again.
 * **Expected** — the link is still there, having been read back from the backend.
 *
 * The existing spec asserts the link appears. This asserts it *persists* — that the issue was
 * recorded on the report rather than held in the component that created it. `F-010` is the same
 * class of mistake one step further on: a result written to a slot that had already gone.
 */
test('an opened issue is still on the report when it is opened again', async ({ page }) => {
  await signIn(page, '/feedback')

  await page.getByRole('button', { name: OPEN_REPORT }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Create issue' }).click()
  await expect(dialog.getByRole('link', { name: /Open issue on GitLab/ })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  await page.getByRole('button', { name: OPEN_REPORT }).click()
  await expect(page.getByRole('dialog').getByRole('link', { name: /Open issue on GitLab/ })).toBeVisible()
})

/**
 * **State** — signed in, and a backend with no GitLab credentials (`?fault=gitlab-disabled`).
 * **Action** — open a report that has no issue.
 * **Expected** — the escalation control is not offered at all, and nothing asks the endpoint.
 *
 * The second half is the contract claim, and it is the one a screenshot cannot make:
 * `FeedbackService` documents that the endpoint answers `503` when unconfigured and that the
 * control is therefore "hidden on the flag rather than discovered by pressing it". A panel that
 * offered the button and handled the refusal would look identical in a screenshot and be wrong.
 */
test('with GitLab unconfigured the control is withheld, not offered and refused', async ({ page }) => {
  const escalations: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/gitlab-issue')) escalations.push(request.url())
  })

  await signIn(page, '/feedback')
  await page.goto('/feedback?fault=gitlab-disabled')
  await page.getByText(/Bug reports and crash logs sent in by your users/).first().waitFor()

  await page.getByRole('button', { name: OPEN_REPORT }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()

  await expect(dialog.getByRole('button', { name: 'Create issue' })).toBeHidden()
  expect(escalations, 'requests to the escalation endpoint').toEqual([])
})
