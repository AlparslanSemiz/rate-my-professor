import type { Page } from '@playwright/test'

/** The address the demo backend expects, and one of the six the panel offers a code to. */
const ADMIN_EMAIL = 'unzhz@student.kit.edu'
/** Any six characters: the mock backend accepts the code, as a real one would after emailing it. */
const LOGIN_CODE = '123456'

/**
 * Signs in and lands on `path`.
 *
 * Every flow below the login one starts here, and none of them re-asserts the sign-in — that
 * is `signing-in.spec.ts`'s job, and repeating it would make one broken login look like four
 * broken features.
 *
 * @param page the page under test
 * @param path where to go once signed in
 */
export async function signIn(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.getByPlaceholder('admin@student.kit.edu').fill(ADMIN_EMAIL)
  await page.getByRole('button', { name: 'Send me a code' }).click()
  await page.getByPlaceholder('Code from your email').fill(LOGIN_CODE)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(new RegExp(`${path}$`))
}
