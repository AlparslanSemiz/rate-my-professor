import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from '@/components/ErrorBoundary'
import PageLoader from '@/components/PageLoader'
import { routes } from '@/constants/routes'

// One chunk per screen: visiting a section downloads that section, and the initial bundle is
// the shell alone.
const ActivityLogsPage = lazy(() => import('@/features/logs/ActivityLogsPage'))
const AuditLogsPage = lazy(() => import('@/features/logs/AuditLogsPage'))
const CatalogPage = lazy(() => import('@/features/catalog/CatalogPage'))
const CommentsPage = lazy(() => import('@/features/comments/CommentsPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const FeedbackPage = lazy(() => import('@/features/feedback/FeedbackPage'))
const HelpPage = lazy(() => import('@/features/help/HelpPage'))
const UsersPage = lazy(() => import('@/features/users/UsersPage'))

/**
 * The authenticated screens.
 *
 * The boundary is scoped to the routed page rather than to the shell, so one broken screen
 * keeps the sidebar and the sign-out control reachable.
 */
export default function AdminRoutes() {
  return (
    <ErrorBoundary message="This page could not be displayed." retryLabel="Try again">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path={routes.dashboard} element={<DashboardPage />} />
          <Route path={routes.users} element={<UsersPage />} />
          <Route path={routes.feedback} element={<FeedbackPage />} />
          <Route path={routes.comments} element={<CommentsPage />} />
          <Route path={routes.catalog} element={<CatalogPage />} />
          <Route path={routes.auditLogs} element={<AuditLogsPage />} />
          <Route path={routes.activityLogs} element={<ActivityLogsPage />} />
          <Route path={routes.help} element={<HelpPage />} />
          <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
