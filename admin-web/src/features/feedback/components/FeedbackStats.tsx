import { SimpleGrid } from '@mantine/core'
import { IconAlertCircle, IconBug, IconCircleCheck, IconClock } from '@tabler/icons-react'
import type { BugReport } from '../../../api/FeedbackService'
import StatCard from '../../../components/StatCard'
import { statGridCols } from '../../../constants/layout'
import { countByValue } from '../../../utils/collection'

export default function FeedbackStats({ reports }: { reports: BugReport[] }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard label="Total reports" value={reports.length} icon={IconBug} accent="#f97316" />
      <StatCard
        label="Open"
        value={countByValue(reports, 'status', 'OPEN')}
        icon={IconAlertCircle}
        accent="#ef4444"
      />
      <StatCard
        label="Reviewed"
        value={countByValue(reports, 'status', 'REVIEWED')}
        icon={IconClock}
        accent="#3b82f6"
      />
      <StatCard
        label="Action taken"
        value={countByValue(reports, 'status', 'ACTION_TAKEN')}
        icon={IconCircleCheck}
        accent="#22c55e"
      />
    </SimpleGrid>
  )
}
