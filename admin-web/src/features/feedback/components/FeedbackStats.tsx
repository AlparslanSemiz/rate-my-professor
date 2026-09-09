import { SimpleGrid } from '@mantine/core'
import { IconAlertCircle, IconBug, IconCircleCheck, IconClock } from '@tabler/icons-react'
import type { BugReport } from '@/api/feedback'
import StatCard from '@/components/StatCard'
import { statGridCols } from '@/constants/layout'
import { countByValue } from '@/utils/collection'
import { KIT } from '@/constants/colors'

export default function FeedbackStats({ reports }: { reports: BugReport[] }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard label="Total reports" value={reports.length} icon={IconBug} accent={KIT.orange} />
      <StatCard
        label="Open"
        value={countByValue(reports, 'status', 'OPEN')}
        icon={IconAlertCircle}
        accent={KIT.red}
      />
      <StatCard
        label="Reviewed"
        value={countByValue(reports, 'status', 'REVIEWED')}
        icon={IconClock}
        accent={KIT.blue}
      />
      <StatCard
        label="Action taken"
        value={countByValue(reports, 'status', 'ACTION_TAKEN')}
        icon={IconCircleCheck}
        accent={KIT.green}
      />
    </SimpleGrid>
  )
}
