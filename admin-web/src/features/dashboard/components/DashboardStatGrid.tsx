import { SimpleGrid } from '@mantine/core'
import { IconBug, IconShieldCheck, IconUserCheck, IconUsers } from '@tabler/icons-react'
import { StatCardDetailed } from '../../../components/StatCard'
import { moduleAccent } from '../../../constants/colors'
import { statGridCols } from '../../../constants/layout'
import { routes } from '../../../constants/routes'
import type { DashboardStats } from '../hooks/useDashboardData'

// The two cards that stand for a section are drawn in that section's colour; the other two
// describe a subset of the accounts rather than a place to go, so they keep their own.
const ACTIVE_ACCENT = '#22c55e'
const ADMIN_ACCENT = '#f59e0b'

export default function DashboardStatGrid({ stats }: { stats: DashboardStats }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={16} mb={28}>
      <StatCardDetailed label="Total users" value={stats.total} sub={`${stats.active} active`} icon={IconUsers} accent={moduleAccent[routes.users]} />
      {/* Counts accounts whose status is ACTIVE. An INACTIVE account is neither active nor
          blocked, so this is not "everyone who is not blocked". It is also not a measure of
          who is online: nothing /users returns reports that. */}
      <StatCardDetailed label="Active accounts" value={stats.active} sub="Accounts in good standing" icon={IconUserCheck} accent={ACTIVE_ACCENT} />
      <StatCardDetailed label="Admin accounts" value={stats.admins} sub="Privileged accounts" icon={IconShieldCheck} accent={ADMIN_ACCENT} />
      <StatCardDetailed label="Open reports" value={stats.openReports} sub={`of ${stats.totalReports} bug reports`} icon={IconBug} accent={moduleAccent[routes.feedback]} />
    </SimpleGrid>
  )
}
