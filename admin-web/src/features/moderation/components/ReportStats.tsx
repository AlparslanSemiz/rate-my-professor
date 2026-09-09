import { SimpleGrid } from '@mantine/core'
import { IconCheck, IconClock, IconEye, IconX } from '@tabler/icons-react'
import StatCard from '@/components/StatCard'
import { statGridCols } from '@/constants/layout'
import { countByValue } from '@/utils/collection'
import type { ReportItem } from '../model'
import { KIT } from '@/constants/colors'
import { chrome } from '@/theme'

export default function ReportStats({ reports }: { reports: ReportItem[] }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard
        label="Open"
        value={countByValue(reports, 'status', 'OPEN')}
        icon={IconClock}
        accent={KIT.orange}
      />
      <StatCard
        label="Reviewed"
        value={countByValue(reports, 'status', 'REVIEWED')}
        icon={IconEye}
        accent={KIT.blue}
      />
      <StatCard
        label="Dismissed"
        value={countByValue(reports, 'status', 'DISMISSED')}
        icon={IconX}
        accent={chrome.textDim}
      />
      <StatCard
        label="Action taken"
        value={countByValue(reports, 'status', 'ACTION_TAKEN')}
        icon={IconCheck}
        accent={KIT.red}
      />
    </SimpleGrid>
  )
}
