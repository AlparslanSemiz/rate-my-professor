/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /**
   * Set to `'true'` to serve the panel from the in-browser mock backend instead of a real one.
   * Used by the end-to-end suite, and useful for looking at the panel without a deployment.
   */
  readonly VITE_MOCK_BACKEND?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
