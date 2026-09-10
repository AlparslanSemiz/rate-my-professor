import { defineConfig, devices } from '@playwright/test'

/**
 * The end-to-end layer.
 *
 * It runs against **no backend**: `VITE_MOCK_BACKEND` makes the panel serve itself from the
 * same MSW handlers the integration tests use, in a real browser. That is deliberate. These
 * four flows are also the scenarios walked by hand at the Abnahme, and pinning them to a
 * deployment would make them fail for reasons that have nothing to do with the panel at the
 * one moment they are being demonstrated.
 *
 * One browser. The panel is an internal tool used on a desktop, and a cross-browser matrix
 * would buy coverage of a problem nobody has reported at the cost of a suite nobody runs.
 */
const PORT = 5174

export default defineConfig({
  testDir: './e2e',
  /* The specs share one mock backend per page, and each reloads it, so they are independent. */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    /* Kept only for a failure, which is the only time anybody looks at them. */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { VITE_MOCK_BACKEND: 'true' },
    timeout: 60_000,
  },
})
