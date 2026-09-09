import { SimpleGrid } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import ErrorAlert from '@/components/ErrorAlert'
import LoadError from '@/components/LoadError'
import PageLoader from '@/components/PageLoader'
import { twoColumnGridCols } from '@/constants/layout'
import { routes } from '@/constants/routes'
import { STALE_READING_SUFFIX } from './dashboardModel'
import DashboardHeader from './components/DashboardHeader'
import DashboardHero from './components/DashboardHero'
import DashboardStatGrid from './components/DashboardStatGrid'
import ModuleNavigation from './components/ModuleNavigation'
import RecentRegistrations from './components/RecentRegistrations'
import SystemPulse from './components/SystemPulse'
import { useDashboardData } from './hooks/useDashboardData'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { users, stats, activeRate, lastUpdated, loading, error, hasData, retry } =
    useDashboardData()

  // Zeros are indistinguishable from a real empty platform, so nothing is claimed until
  // something has actually been read.
  if (loading && !hasData) return <PageLoader />

  if (!hasData) {
    return (
      <>
        <DashboardHeader />
        <LoadError message={error} onRetry={retry} />
      </>
    )
  }

  return (
    <>
      <DashboardHeader />
      <ErrorAlert message={error ? `${error} ${STALE_READING_SUFFIX}` : ''} />
      <DashboardHero stats={stats} activeRate={activeRate} lastUpdated={lastUpdated} />
      <DashboardStatGrid stats={stats} />
      <SimpleGrid cols={twoColumnGridCols} spacing={16} mb={28}>
        <SystemPulse stats={stats} activeRate={activeRate} />
        <RecentRegistrations users={users} onViewAll={() => navigate(routes.users)} />
      </SimpleGrid>
      <ModuleNavigation onNavigate={navigate} />
    </>
  )
}
