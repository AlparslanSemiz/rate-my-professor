import { Text } from '@mantine/core'
import { IconSchool } from '@tabler/icons-react'
import type { Lecture } from '@/api/catalog'
import CatalogTablePanel, { CatalogEmptyRow } from './CatalogTablePanel'
import LectureTableRow from './LectureTableRow'
import { chrome, iconSize } from '@/theme'

const TABLE_COLUMNS = ['Lecture', 'Term', 'Type', 'Professors', 'Status', 'Comments', 'Ratings', ''] as const

interface LecturesTableProps {
  lectures: Lecture[]
  totalCount: number
  mutating: boolean
  onEdit: (lecture: Lecture) => void
  onDelete: (lecture: Lecture) => void
}

export default function LecturesTable({
  lectures,
  totalCount,
  mutating,
  onEdit,
  onDelete,
}: LecturesTableProps) {
  return (
    <CatalogTablePanel
      title="Lectures"
      icon={<IconSchool size={iconSize.inline} color={chrome.textDim} />}
      description={`${lectures.length} of ${totalCount} in the catalogue`}
      columns={TABLE_COLUMNS}
      minWidth={1000}
    >
      {lectures.length === 0 ? (
        <CatalogEmptyRow colSpan={TABLE_COLUMNS.length}>
          <Text c={chrome.textFaint} size="sm">
            No lectures found.
          </Text>
        </CatalogEmptyRow>
      ) : (
        lectures.map((lecture, index) => (
          <LectureTableRow
            key={lecture.id}
            lecture={lecture}
            isLast={index === lectures.length - 1}
            mutating={mutating}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </CatalogTablePanel>
  )
}
