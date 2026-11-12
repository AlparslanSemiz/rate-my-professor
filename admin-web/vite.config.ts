import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Backend the dev server proxies to. Override with VITE_API_TARGET to point the panel at a
 * locally running backend instead of the deployed one.
 */
const DEFAULT_API_TARGET =
  'https://8a1babdc-cf6d-4fdc-80a7-dc585f5853ed.ka.bw-cloud-instance.org'

/**
 * The base every test runs against, pinned rather than inherited.
 *
 * `/api` is what `.env` sets for development and what the Dockerfile still defaults to. It is
 * deliberately *not* what CI bakes into the deployed bundle any more — that is empty, so the
 * panel calls its own origin. The divergence is safe because the base only ever prefixes the
 * path: what the backend sees is the same suffix either way, and the suite's request assertions
 * need *some* fixed base to name. Pinning one here is what stops a pipeline variable from
 * choosing it. `F-025`.
 */
const TEST_API_BASE_URL = '/api'

/**
 * The deployed panel is served from `/admin/` on the same host as the API, so production
 * builds need that prefix baked into their asset URLs. The dev server keeps serving from the
 * root. Override with VITE_BASE_PATH when deploying under a different path.
 *
 * https://vite.dev/config/
 */
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || DEFAULT_API_TARGET

  return {
    base: command === 'build' ? (process.env.VITE_BASE_PATH ?? '/admin/') : '/',
    plugins: [react()],
    /**
     * `@/` resolves to `src/`, so a module is imported by where it lives rather than by how
     * far the importing file happens to sit from it. Vitest reads this config, so the alias
     * holds in tests too; the matching declaration for the type-checker is `paths` in
     * `tsconfig.app.json`, and the two have to be changed together.
     */
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    /**
     * In production the panel is served from the same host as the API, so every call is
     * same-origin. This proxy gives development the same shape: the browser calls
     * `/api/...` on the dev server, which forwards to the backend. Without it the backend
     * refuses the preflight — its CORS allowlist holds only its own origin, so a request
     * from http://localhost:5173 comes back 403 before any response body exists.
     *
     * `Origin` is overridden as well as `Host`: a same-origin POST still carries the dev
     * server's origin, and forwarding that unchanged is exactly what the backend rejects.
     */
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          headers: { Origin: apiTarget },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      /**
       * The API base the suite runs against, pinned rather than inherited.
       *
       * Both `ApiClient` and the MSW handlers derive their base from
       * `VITE_API_BASE_URL`, so any value keeps them matching and every assertion about
       * the *screen* passes. The assertions about the *request* do not: they name absolute
       * paths like `/api/auth/login`, and those only exist while the base contributes
       * `/api`. CI sets `VITE_API_BASE_URL` to the deployed backend for `web:build` and
       * `web:image`, that global reached `web:test` as well, and thirty request assertions
       * failed there while passing locally — each reporting nothing more useful than
       * "expected [] to have a length of 1", because the requests had gone out under
       * `/auth/login` instead. Pinning it here makes the suite independent of whatever the
       * surrounding environment happens to export, which is the same reason `src/test/http.ts`
       * stubs the network.
       */
      env: { VITE_API_BASE_URL: TEST_API_BASE_URL },
      /**
       * `e2e/` is Playwright's, and its specs match Vitest's default `*.spec.ts` pattern —
       * without this they would be collected here and fail on the first `page` reference.
       */
      exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
      /**
       * `all: true` so a file no test imports counts as zero rather than disappearing from
       * the report — the point of the baseline is to show what is uncovered.
       *
       * No thresholds. `docs/TODO.md` decided on thresholds at target from day one, which is
       * deliberately red until roughly Phase 6 of the test strategy; that would leave the
       * refactor without a pass/fail signal of its own. They are enforced on the
       * `test-strategy` branch instead, where a red suite is the intended state.
       */
      coverage: {
        provider: 'v8',
        /**
         * `json-summary` is what `docs/testfindings.md`'s per-directory table is aggregated
         * from, and it was missing: three documents said the figures were generated from
         * `coverage/coverage-summary.json` while `npm run test:coverage` never wrote one. The
         * file on disk was a leftover from a one-off invocation, so the next person to follow
         * the documented procedure would have re-published a stale table without knowing.
         */
        reporter: ['text', 'html', 'lcov', 'json-summary'],
        all: true,
        include: ['src/**'],
        exclude: ['src/main.tsx', 'src/vite-env.d.ts', '**/*.d.ts', 'src/test/**'],
      },
    },
  }
})
