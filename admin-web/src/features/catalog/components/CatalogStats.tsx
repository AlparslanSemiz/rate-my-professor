import { SimpleGrid } from '@mantine/core'
import { IconMessage, IconSchool, IconStar, IconUserStar } from '@tabler/icons-react'
import type { Lecture, Professor } from '@/api/catalog'
import StatCard from '@/components/StatCard'
import { statGridCols } from '@/constants/layout'
import { KIT } from '@/constants/colors'

interface CatalogStatsProps {
  lectures: Lecture[]
  professors: Professor[]
}

export default function CatalogStats({ lectures, professors }: CatalogStatsProps) {
  const comments = lectures.reduce((total, lecture) => total + lecture.commentCount, 0)
  const ratings = lectures.reduce((total, lecture) => total + lecture.ratingCount, 0)

  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard label="Lectures" value={lectures.length} icon={IconSchool} accent={KIT.blue} />
      <StatCard
        label="Professors"
        value={professors.length}
        icon={IconUserStar}
        accent={KIT.grape}
      />
      <StatCard label="Comments" value={comments} icon={IconMessage} accent={KIT.green} />
      <StatCard label="Ratings" value={ratings} icon={IconStar} accent={KIT.orange} />
    </SimpleGrid>
  )
}
