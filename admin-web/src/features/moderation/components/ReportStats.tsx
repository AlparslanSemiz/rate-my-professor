import { SimpleGrid } from '@mantine/core'
import { IconCheck, IconClock, IconEye, IconX } from '@tabler/icons-react'
import StatCard from '../../../components/StatCard'
import { statGridCols } from '../../../constants/layout'
import { countByValue } from '../../../utils/collection'
import type { ReportItem } from '../moderationModel'

export default function ReportStats({ reports }: { reports: ReportItem[] }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard
        label="Open"
        value={countByValue(reports, 'status', 'OPEN')}
        icon={IconClock}
        accent="#f97316"
      />
      <StatCard
        label="Reviewed"
        value={countByValue(reports, 'status', 'REVIEWED')}
        icon={IconEye}
        accent="#3b82f6"
      />
      <StatCard
        label="Dismissed"
        value={countByValue(reports, 'status', 'DISMISSED')}
        icon={IconX}
        accent="#6b7280"
      />
      <StatCard
        label="Action taken"
        value={countByValue(reports, 'status', 'ACTION_TAKEN')}
        icon={IconCheck}
        accent="#ef4444"
      />
    </SimpleGrid>
  )
}
