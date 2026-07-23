import { SimpleGrid } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { twoColumnGridCols } from '../../constants/layout'
import { routes } from '../../constants/routes'
import DashboardHeader from './components/DashboardHeader'
import DashboardHero from './components/DashboardHero'
import DashboardStatGrid from './components/DashboardStatGrid'
import ModuleNavigation from './components/ModuleNavigation'
import RecentRegistrations from './components/RecentRegistrations'
import SystemPulse from './components/SystemPulse'
import { useDashboardData } from './hooks/useDashboardData'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { users, stats, activeRate, lastUpdated } = useDashboardData()

  return (
    <>
      <DashboardHeader />
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
