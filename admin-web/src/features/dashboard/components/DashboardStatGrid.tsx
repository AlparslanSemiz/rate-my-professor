import { SimpleGrid } from '@mantine/core'
import { IconBug, IconShieldCheck, IconUserCheck, IconUsers } from '@tabler/icons-react'
import { StatCardDetailed } from '@/components/StatCard'
import { KIT, accentForRoute } from '@/constants/colors'
import { statGridCols } from '@/constants/layout'
import { routes } from '@/constants/routes'
import { DASHBOARD_CARDS, type DashboardStats } from '../dashboardModel'

// The two cards that stand for a section are drawn in that section's colour; the other two
// describe a subset of the accounts rather than a place to go, so they keep their own.
const ACTIVE_ACCENT = KIT.green
const ADMIN_ACCENT = KIT.orange

export default function DashboardStatGrid({ stats }: { stats: DashboardStats }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={16} mb={28}>
      <StatCardDetailed label={DASHBOARD_CARDS.total} value={stats.total} sub={`${stats.active} active`} icon={IconUsers} accent={accentForRoute(routes.users)} />
      {/* `counts.activeUsers`: accounts whose status is ACTIVE. An INACTIVE account is
          neither active nor blocked, so this is not "everyone who is not blocked". It is also
          not a measure of who is online — the backend counts no such thing. */}
      <StatCardDetailed label={DASHBOARD_CARDS.active} value={stats.active} sub="Accounts in good standing" icon={IconUserCheck} accent={ACTIVE_ACCENT} />
      <StatCardDetailed label={DASHBOARD_CARDS.admins} value={stats.admins} sub="Privileged accounts" icon={IconShieldCheck} accent={ADMIN_ACCENT} />
      {/* No sub-line: /system/status counts the open ones, and there is no counter for how
          many bug reports exist in total. */}
      <StatCardDetailed label={DASHBOARD_CARDS.openReports} value={stats.openReports} sub="Bug reports waiting" icon={IconBug} accent={accentForRoute(routes.feedback)} />
    </SimpleGrid>
  )
}
