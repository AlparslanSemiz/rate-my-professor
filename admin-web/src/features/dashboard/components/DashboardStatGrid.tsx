import { SimpleGrid } from '@mantine/core'
import { IconBug, IconShieldCheck, IconUserCheck, IconUsers } from '@tabler/icons-react'
import { StatCardDetailed } from '../../../components/StatCard'
import { statGridCols } from '../../../constants/layout'
import type { DashboardStats } from '../hooks/useDashboardData'

export default function DashboardStatGrid({ stats }: { stats: DashboardStats }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={16} mb={28}>
      <StatCardDetailed label="Total users" value={stats.total} sub={`${stats.active} not blocked`} icon={IconUsers} accent="#3b82f6" />
      {/* Counts accounts whose status is ACTIVE, which means "not blocked". It is not a
          measure of who is online: nothing /users returns reports that. */}
      <StatCardDetailed label="Not blocked" value={stats.active} sub="Accounts in good standing" icon={IconUserCheck} accent="#22c55e" />
      <StatCardDetailed label="Admin accounts" value={stats.admins} sub="Privileged accounts" icon={IconShieldCheck} accent="#f59e0b" />
      <StatCardDetailed label="Open reports" value={stats.openReports} sub={`of ${stats.totalReports} bug reports`} icon={IconBug} accent="#f97316" />
    </SimpleGrid>
  )
}
