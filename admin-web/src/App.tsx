import { lazy, Suspense } from 'react'
import { MantineProvider } from '@mantine/core'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PageLoader from './components/PageLoader'
import ProtectedRoute from './components/ProtectedRoute'
import { theme } from './theme'
import { routes } from './constants/routes'

const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const LoginPage = lazy(() => import('./features/auth/LoginPage'))

/**
 * Keeps client-side routing inside the path the bundle was built for. Without this, a build
 * served from `/admin/` would navigate to `/login` at the host root, which the server does
 * not serve. Empty in development, where the base is `/`.
 */
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
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
    </MantineProvider>
  )
}
