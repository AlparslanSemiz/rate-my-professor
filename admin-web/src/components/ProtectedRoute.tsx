import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'
import type { ReactNode } from 'react'
import { routes } from '@/constants/routes'
import PageLoader from './PageLoader'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, checking } = useAuth()
  const location = useLocation()

  // Waiting here keeps a valid session from being bounced to the login screen before the
  // backend has had a chance to confirm the stored token.
  if (checking) return <PageLoader />

  // The attempted path travels with the redirect so signing in returns to it rather than
  // dropping the admin on the dashboard.
  if (!isAuthenticated) {
    return <Navigate to={routes.login} replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
