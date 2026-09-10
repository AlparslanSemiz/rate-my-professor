import { expect, test } from '@playwright/test'

/**
 * What the panel says about itself before any of it has rendered.
 *
 * The release-readiness audit found this half-built: a real `<title>` and a correct `lang`, but
 * no description, nothing at all discouraging a crawler, and a favicon that was the 512x512
 * Play Store launcher icon — 136 KB of PNG to draw a 16 px square in a browser tab.
 *
 * This panel sits behind a login wall on a public host. It is not a marketing site, so it has
 * no sitemap, no social preview and no policy pages by decision rather than by omission
 * (`docs/testplan.md`). The one thing it does owe a crawler is a refusal.
 */
/** Large enough for a mark at every size a tab or a bookmark asks for, small enough not to matter. */
const FAVICON_BUDGET_BYTES = 8 * 1024

test.describe('the document head', () => {
  test('names the panel, and does not use a template default', async ({ page }) => {
    await page.goto('/login')

    const title = await page.title()
    expect(title).toBe('RateMyProfessor Admin Panel')
    // Measured rather than assumed: a Vite starter ships `Vite + React + TS`, and a title left
    // at the default is the clearest single sign that nobody looked at this file.
    expect(title).not.toMatch(/^Vite/)
  })

  test('declares its language, so a screen reader picks the right voice', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('describes itself', async ({ page }) => {
    await page.goto('/login')

    const description = page.locator('meta[name="description"]')
    await expect(description).toHaveCount(1)
    expect((await description.getAttribute('content'))?.trim()).toBeTruthy()
  })

  test('asks not to be indexed, in the head and in robots.txt', async ({ page, request }) => {
    await page.goto('/login')

    // Both, because they answer different crawlers: `robots.txt` is read before the page is
    // fetched at all, and the meta tag is what a crawler that ignored it still has to obey.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/,
    )

    // Served from `public/`, so it follows the bundle's base path: it is `/robots.txt` here and
    // in any root deployment, but `/admin/robots.txt` in production - and a crawler only ever
    // reads the domain root. Recorded as `F-047`: at `/admin/` the meta tag above is the half
    // that actually does the work, and a root-level rule is a job for the host proxy, which is
    // not in this repository.
    const robots = await request.get('/robots.txt')
    expect(robots.status()).toBe(200)
    expect(await robots.text()).toMatch(/Disallow:\s*\/\s*$/m)
  })

  test('carries a favicon that is worth its bytes', async ({ page, request }) => {
    await page.goto('/login')

    const href = await page.locator('link[rel="icon"]').first().getAttribute('href')
    expect(href).toBeTruthy()

    const icon = await request.get(href!)
    expect(icon.status()).toBe(200)

    // The size is the point of the test. A 136 KB launcher icon loads correctly and looks
    // right, so nothing but a measurement catches it.
    const bytes = (await icon.body()).byteLength
    expect(bytes, `${href} is ${bytes} bytes`).toBeLessThan(FAVICON_BUDGET_BYTES)
  })
})
