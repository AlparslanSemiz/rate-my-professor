import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Backend the dev server proxies to. Override with VITE_API_TARGET to point the panel at a
 * locally running backend instead of the deployed one.
 */
const DEFAULT_API_TARGET =
  'https://server.example.org'

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
    },
  }
})
