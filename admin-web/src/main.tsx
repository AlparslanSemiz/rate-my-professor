import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import '@mantine/core/styles.css'
// After Mantine's sheet: these classes deliberately win over component defaults.
import './interactive.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element #root was not found')
}

/**
 * Starts the in-browser mock backend when the panel is asked to run without a real one.
 *
 * The import is dynamic and behind a compile-time constant, so a production build folds the
 * branch away and never pulls MSW or the fixtures into the bundle.
 */
async function startMockBackendIfRequested(): Promise<void> {
  if (import.meta.env.VITE_MOCK_BACKEND !== 'true') return
  const { startBrowserMockBackend } = await import('./test/msw/browser')
  await startBrowserMockBackend()
}

// Awaited before the first render, so no screen can send a request the worker is not yet
// intercepting — which would reach the network and fail for the wrong reason.
void startMockBackendIfRequested().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
