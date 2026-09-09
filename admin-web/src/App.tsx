import { lazy, Suspense, useState } from 'react'
import { MantineProvider } from '@mantine/core'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import PageLoader from './components/PageLoader'
import ProtectedRoute from './components/ProtectedRoute'
import { theme } from './theme'
import { routes } from './constants/routes'
import { createQueryClient } from './query'

const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const LoginPage = lazy(() => import('./features/auth/LoginPage'))

/**
 * Keeps client-side routing inside the path the bundle was built for. Without this, a build
 * served from `/admin/` would navigate to `/login` at the host root, which the server does
 * not serve. Empty in development, where the base is `/`.
 */
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export default function App() {
  // One client per mounted app, not per module. At module scope a test rendering `App` twice
  // would have the second render read the first one's cache, which is exactly the kind of
  // order dependence the suite is kept free of.
  const [queryClient] = useState(createQueryClient)

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      {/* Last line of defence. Without it a render error anywhere below leaves the operator
          looking at a blank page with nothing to act on. */}
      <ErrorBoundary
        message="The panel hit an unexpected error and could not finish rendering."
        retryLabel="Reload the panel"
        onReset={() => window.location.reload()}
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter basename={routerBasename}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path={routes.login} element={<LoginPage />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </MantineProvider>
  )
}
