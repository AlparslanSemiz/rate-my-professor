import { SimpleGrid } from '@mantine/core'
import { IconEye, IconEyeOff, IconFlag, IconMessage } from '@tabler/icons-react'
import StatCard from '@/components/StatCard'
import { statGridCols } from '@/constants/layout'
import { countByValue } from '@/utils/collection'
import { flattenContent, type ModeratedItem } from '../model'
import { KIT } from '@/constants/colors'

interface ContentStatsProps {
  items: ModeratedItem[]
  totalLabel: string
}

export default function ContentStats({ items, totalLabel }: ContentStatsProps) {
  // Answers are moderated from this same table, so leaving them out of the counts would
  // describe a smaller platform than the one on screen.
  const all = flattenContent(items)
  const reported = all.filter((item) => item.reports > 0).length

  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard label={totalLabel} value={all.length} icon={IconMessage} accent={KIT.blue} />
      <StatCard
        label="Visible"
        value={countByValue(all, 'status', 'VISIBLE')}
        icon={IconEye}
        accent={KIT.green}
      />
      <StatCard
        label="Hidden"
        value={countByValue(all, 'status', 'HIDDEN')}
        icon={IconEyeOff}
        accent={KIT.orange}
      />
      <StatCard label="With reports" value={reported} icon={IconFlag} accent={KIT.red} />
    </SimpleGrid>
  )
}
