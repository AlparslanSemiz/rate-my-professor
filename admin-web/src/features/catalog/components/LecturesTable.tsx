import { Text, TextInput, type CSSProperties } from '@mantine/core'
import { IconSchool, IconSearch } from '@tabler/icons-react'
import type { Lecture } from '@/api/catalog'
import CatalogTablePanel, { CatalogEmptyRow } from './CatalogTablePanel'
import LectureTableRow from './LectureTableRow'
import { chrome, iconSize } from '@/theme'
import { searchFieldWidth } from '@/constants/layout'

const TABLE_COLUMNS = ['Lecture', 'Term', 'Type', 'Professors', 'Status', 'Comments', 'Ratings', ''] as const

const searchInputStyle: CSSProperties = searchFieldWidth

interface LecturesTableProps {
  lectures: Lecture[]
  totalCount: number
  search: string
  mutating: boolean
  onSearchChange: (value: string) => void
  onEdit: (lecture: Lecture) => void
  onDelete: (lecture: Lecture) => void
}

export default function LecturesTable({
  lectures,
  totalCount,
  search,
  mutating,
  onSearchChange,
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
      controls={
        <TextInput
          placeholder="Search by name, code, or professor..."
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          style={searchInputStyle}
          size="sm"
          aria-label="Search lectures"
          leftSection={<IconSearch size={iconSize.inline} color={chrome.textDim} />}
        />
      }
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
