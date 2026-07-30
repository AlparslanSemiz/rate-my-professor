import { SimpleGrid } from '@mantine/core'
import { IconMessage, IconSchool, IconStar, IconUserStar } from '@tabler/icons-react'
import type { Lecture, Professor } from '../../../api/CatalogService'
import StatCard from '../../../components/StatCard'
import { statGridCols } from '../../../constants/layout'

interface CatalogStatsProps {
  lectures: Lecture[]
  professors: Professor[]
}

export default function CatalogStats({ lectures, professors }: CatalogStatsProps) {
  const comments = lectures.reduce((total, lecture) => total + lecture.commentCount, 0)
  const ratings = lectures.reduce((total, lecture) => total + lecture.ratingCount, 0)

  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard label="Lectures" value={lectures.length} icon={IconSchool} accent="#3b82f6" />
      <StatCard
        label="Professors"
        value={professors.length}
        icon={IconUserStar}
        accent="#a855f7"
      />
      <StatCard label="Comments" value={comments} icon={IconMessage} accent="#22c55e" />
      <StatCard label="Ratings" value={ratings} icon={IconStar} accent="#f59e0b" />
    </SimpleGrid>
  )
}
