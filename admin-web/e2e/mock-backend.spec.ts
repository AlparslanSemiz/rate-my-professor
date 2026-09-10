import { expect, test } from '@playwright/test'
import { ROUTES, open } from './routes'

/**
 * That the end-to-end layer really does run against no backend.
 *
 * This was not true until this round. The browser worker starts with
 * `onUnhandledRequest: 'bypass'` — it has to, because the panel legitimately asks for its own
 * assets and Vite's client — and the handler set had **no catalogue slice at all**. So
 * `/data/lectures`, `/data/professor` and `/ratings` fell straight through the worker to the
 * Vite proxy and out to the deployed backend, from a suite whose whole premise is that it
 * contacts nothing. Nobody noticed because no spec opened the catalogue. The catalogue now
 * reads the `/all` pair (`F-006`), and those are handled here too - a new endpoint with no
 * handler is exactly how this escapes again.
 *
 * `src/test/msw/handlers/catalog.ts` closed it. This is what keeps it closed, and it is
 * deliberately a *measurement* rather than a claim: `Response.fromServiceWorker()` says whether
 * MSW answered, so an endpoint that starts escaping again is named rather than merely suspected.
 */
/** Where the panel's requests go, as `.env` sets it for development and the Dockerfile defaults it. */
const API_BASE = '/api'

for (const route of ROUTES) {
  /**
   * **State** — one route, loaded, with every response recorded.
   * **Action** — read back which of them the mock worker answered.
   * **Expected** — every API call was answered by MSW; none reached the network.
   */
  test(`${route.name} is served entirely by the mock backend`, async ({ page }) => {
    const escaped: string[] = []
    const answered: string[] = []

    page.on('response', (response) => {
      const url = response.url()
      // The **path**, not a substring: Vite serves the panel's own modules from
      // `/src/api/client/…` in development, and matching those as API traffic reports fifteen
      // escapes on a page that made none.
      if (!new URL(url).pathname.startsWith(`${API_BASE}/`)) return
      if (response.fromServiceWorker()) answered.push(url)
      else escaped.push(url)
    })

    await open(page, route)

    // The sign-in screen asks for nothing until the form is used, so it legitimately records no
    // API traffic at all; every other route reads something before it can render.
    if (route.signedIn) {
      expect(answered.length, `API calls answered by MSW on ${route.name}`).toBeGreaterThan(0)
    }
    expect(escaped, `API calls that escaped to the network on ${route.name}`).toEqual([])
  })
}
