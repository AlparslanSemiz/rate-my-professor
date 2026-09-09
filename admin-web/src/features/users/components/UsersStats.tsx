import { SimpleGrid } from '@mantine/core'
import { IconShieldCheck, IconUserCheck, IconUsers } from '@tabler/icons-react'
import StatCard from '@/components/StatCard'
import { KIT, accentForRoute } from '@/constants/colors'
import { statGridCols } from '@/constants/layout'
import { routes } from '@/constants/routes'
import type { UserCounts } from '../model'
import { EMPTY_VALUE } from '@/utils/emptyValue'

const ACTIVE_ACCENT = KIT.green
const ADMIN_ACCENT = KIT.orange

/** A counter the backend did not report is unknown, not zero. */
function figure(value: number | null) {
  return value === null ? EMPTY_VALUE : value
}

/**
 * Counted by the backend rather than from the rows on screen: the table is one page of a
 * listing, so it cannot say how many accounts exist. There is no counter for blocked accounts
 * yet, which is why that card is missing — see the Known Backend Gaps table in the README.
 */
export default function UsersStats({ counts }: { counts: UserCounts }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard label="Total users" value={figure(counts.total)} icon={IconUsers} accent={accentForRoute(routes.users)} />
      <StatCard label="Active" value={figure(counts.active)} icon={IconUserCheck} accent={ACTIVE_ACCENT} />
      <StatCard label="Admin accounts" value={figure(counts.admins)} icon={IconShieldCheck} accent={ADMIN_ACCENT} />
    </SimpleGrid>
  )
}
