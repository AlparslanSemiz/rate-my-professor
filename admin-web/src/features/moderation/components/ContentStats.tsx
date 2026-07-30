import { SimpleGrid } from '@mantine/core'
import { IconEye, IconEyeOff, IconFlag, IconMessage } from '@tabler/icons-react'
import StatCard from '../../../components/StatCard'
import { statGridCols } from '../../../constants/layout'
import { countByValue } from '../../../utils/collection'
import type { ModeratedItem } from '../moderationModel'

interface ContentStatsProps {
  items: ModeratedItem[]
  totalLabel: string
}

export default function ContentStats({ items, totalLabel }: ContentStatsProps) {
  const reported = items.filter((item) => item.reports > 0).length

  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard label={totalLabel} value={items.length} icon={IconMessage} accent="#3b82f6" />
      <StatCard
        label="Visible"
        value={countByValue(items, 'status', 'VISIBLE')}
        icon={IconEye}
        accent="#22c55e"
      />
      <StatCard
        label="Hidden"
        value={countByValue(items, 'status', 'HIDDEN')}
        icon={IconEyeOff}
        accent="#f97316"
      />
      <StatCard label="With reports" value={reported} icon={IconFlag} accent="#ef4444" />
    </SimpleGrid>
  )
}
