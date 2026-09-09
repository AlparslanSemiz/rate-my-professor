import type { Page } from '@playwright/test'
import { signIn } from './signIn'

/**
 * The nine routes, and the text that means one has finished loading.
 *
 * Page **descriptions**, not titles: every title is also a sidebar link, so waiting for
 * `Comments` matches the navigation while the screen is still a spinner. The jsdom layer made
 * exactly that mistake and reported clean routes it had never seen — see the note in
 * `src/App.a11y.integration.test.tsx`.
 */
export const ROUTES = [
  { path: '/login', name: 'Sign in', marker: /Pop in your KIT student email/, signedIn: false },
  { path: '/dashboard', name: 'Dashboard', marker: /A quick look at how your community's doing today/, signedIn: true },
  { path: '/users', name: 'Users', marker: /Everyone who's signed up/, signedIn: true },
  { path: '/comments', name: 'Comments', marker: /Every comment in the app, with its answers nested underneath/, signedIn: true },
  { path: '/catalog', name: 'Lectures & Professors', marker: /The lectures students rate and the professors who teach them/, signedIn: true },
  { path: '/feedback', name: 'Bug Reports', marker: /Bug reports and crash logs sent in by your users/, signedIn: true },
  { path: '/audit-logs', name: 'Audit Logs', marker: /A trace of successful admin actions/, signedIn: true },
  { path: '/activity-logs', name: 'Activity Logs', marker: /Everything people do in the app/, signedIn: true },
  { path: '/help', name: 'Help', marker: /What each status means and what happens when you use a control/, signedIn: true },
] as const

/**
 * Opens one route and waits until its own content is on screen.
 *
 * @param page the Playwright page
 * @param route one of {@link ROUTES}
 * @param query anything to append, e.g. `?fault=session-check`
 */
export async function open(page: Page, route: (typeof ROUTES)[number], query = ''): Promise<void> {
  if (route.signedIn) {
    await signIn(page, route.path)
  } else {
    await page.goto(`${route.path}${query}`)
  }
  if (route.signedIn && query) {
    await page.goto(`${route.path}${query}`)
  }
  await page.getByText(route.marker).first().waitFor()
}
