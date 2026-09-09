import { SimpleGrid } from '@mantine/core'
import { IconBug, IconShieldCheck, IconUserCheck, IconUsers } from '@tabler/icons-react'
import { StatCardDetailed } from '@/components/StatCard'
import { KIT, moduleAccent } from '@/constants/colors'
import { statGridCols } from '@/constants/layout'
import { routes } from '@/constants/routes'
import type { DashboardStats } from '../dashboardModel'

// The two cards that stand for a section are drawn in that section's colour; the other two
// describe a subset of the accounts rather than a place to go, so they keep their own.
const ACTIVE_ACCENT = KIT.green
const ADMIN_ACCENT = KIT.orange

export default function DashboardStatGrid({ stats }: { stats: DashboardStats }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={16} mb={28}>
      <StatCardDetailed label="Total users" value={stats.total} sub={`${stats.active} active`} icon={IconUsers} accent={moduleAccent[routes.users]} />
      {/* `counts.activeUsers`: accounts whose status is ACTIVE. An INACTIVE account is
          neither active nor blocked, so this is not "everyone who is not blocked". It is also
          not a measure of who is online — the backend counts no such thing. */}
      <StatCardDetailed label="Active accounts" value={stats.active} sub="Accounts in good standing" icon={IconUserCheck} accent={ACTIVE_ACCENT} />
      <StatCardDetailed label="Admin accounts" value={stats.admins} sub="Privileged accounts" icon={IconShieldCheck} accent={ADMIN_ACCENT} />
      {/* No sub-line: /system/status counts the open ones, and there is no counter for how
          many bug reports exist in total. */}
      <StatCardDetailed label="Open reports" value={stats.openReports} sub="Bug reports waiting" icon={IconBug} accent={moduleAccent[routes.feedback]} />
    </SimpleGrid>
  )
}
