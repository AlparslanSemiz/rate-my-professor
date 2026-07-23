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

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <AuthProvider>
        <BrowserRouter>
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
