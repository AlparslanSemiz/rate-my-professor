import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * The deployed panel is served from `/admin/` on the same host as the API, so production
 * builds need that prefix baked into their asset URLs. The dev server keeps serving from the
 * root. Override with VITE_BASE_PATH when deploying under a different path.
 *
 * https://vite.dev/config/
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.VITE_BASE_PATH ?? '/admin/') : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
}))
