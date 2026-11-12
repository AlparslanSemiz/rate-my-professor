import { useNavigate } from 'react-router-dom'
import ErrorAlert from '@/components/ErrorAlert'
import LoadError from '@/components/LoadError'
import PageLoader from '@/components/PageLoader'
import { routes } from '@/constants/routes'
import { STALE_READING_SUFFIX } from './dashboardModel'
import DashboardHeader from './components/DashboardHeader'
import DashboardHero from './components/DashboardHero'
import DashboardStatGrid from './components/DashboardStatGrid'
import RecentRegistrations from './components/RecentRegistrations'
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
      {/*
        `F-066`: the dashboard showed four facts eight times and overflowed by 223px at 1440.
        The two progress bars were a third rendering of the active share and a second of the
        admin count, and "Jump to" repeated three destinations the sidebar offers at all times.
        Both are gone; nothing they carried was lost, because every value is still on a card
        and the reading time is still in the hero.
      */}
      <RecentRegistrations users={users} onViewAll={() => navigate(routes.users)} />
    </>
  )
}
