import { expect, test } from '@playwright/test'

/**
 * **State** — signed out, on the login screen.
 * **Action** — enter an admin address, ask for a code, enter it.
 * **Expected** — the dashboard, signed in as that admin.
 *
 * Also walked by hand at the Abnahme, which is why each step reads as an instruction.
 */
test('signs in with an emailed code and lands on the dashboard', async ({ page }) => {
  await page.goto('/login')

  await page.getByPlaceholder('admin@student.kit.edu').fill('u-kisi4@student.kit.edu')
  await page.getByRole('button', { name: 'Send me a code' }).click()

  await page.getByPlaceholder('Code from your email').fill('123456')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByText('Welcome back, Alparslan Semiz')).toBeVisible()
})

/**
 * **State** — signed out.
 * **Action** — enter an address that is not on the admin team.
 * **Expected** — refused on the spot, with no code requested and no second step offered.
 */
test('refuses an address outside the admin team without asking the backend', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))

  await page.goto('/login')
  await page.getByPlaceholder('admin@student.kit.edu').fill('jemand@student.kit.edu')
  await page.getByRole('button', { name: 'Send me a code' }).click()

  await expect(page.getByText(/no login code was sent/)).toBeVisible()
  await expect(page.getByPlaceholder('Code from your email')).toBeHidden()
  expect(requests.filter((url) => url.includes('/auth/request-login'))).toHaveLength(0)
})

/**
 * **State** — signed out, having tried to open a protected page.
 * **Action** — sign in.
 * **Expected** — the page that was attempted, not the dashboard.
 */
test('returns to the page the operator was trying to reach', async ({ page }) => {
  await page.goto('/audit-logs')
  await expect(page).toHaveURL(/\/login$/)

  await page.getByPlaceholder('admin@student.kit.edu').fill('u-kisi4@student.kit.edu')
  await page.getByRole('button', { name: 'Send me a code' }).click()
  await page.getByPlaceholder('Code from your email').fill('123456')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page).toHaveURL(/\/audit-logs$/)
})
