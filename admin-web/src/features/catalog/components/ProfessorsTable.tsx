import { Text, TextInput, type CSSProperties } from '@mantine/core'
import { IconSearch, IconUserStar } from '@tabler/icons-react'
import type { Lecture, Professor } from '@/api/catalog'
import CatalogTablePanel, { CatalogEmptyRow } from './CatalogTablePanel'
import ProfessorTableRow from './ProfessorTableRow'
import { chrome } from '@/theme'

const TABLE_COLUMNS = ['Professor', 'Lectures', 'Status', 'Average rating', 'Ratings', ''] as const

const searchInputStyle: CSSProperties = { flex: '1 1 240px', maxWidth: 320 }

interface ProfessorsTableProps {
  professors: Professor[]
  totalCount: number
  search: string
  mutating: boolean
  lecturesById: Map<string, Lecture>
  onSearchChange: (value: string) => void
  onEdit: (professor: Professor) => void
  onDelete: (professor: Professor) => void
}

export default function ProfessorsTable({
  professors,
  totalCount,
  search,
  mutating,
  lecturesById,
  onSearchChange,
  onEdit,
  onDelete,
}: ProfessorsTableProps) {
  return (
    <CatalogTablePanel
      title="Professors"
      icon={<IconUserStar size={14} color={chrome.textDim} />}
      description={`${professors.length} of ${totalCount} in the catalogue`}
      columns={TABLE_COLUMNS}
      minWidth={860}
      controls={
        <TextInput
          placeholder="Search by name..."
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          style={searchInputStyle}
          size="sm"
          aria-label="Search professors"
          leftSection={<IconSearch size={14} color={chrome.textDim} />}
        />
      }
    >
      {professors.length === 0 ? (
        <CatalogEmptyRow colSpan={TABLE_COLUMNS.length}>
          <Text c={chrome.textFaint} size="sm">
            No professors found.
          </Text>
        </CatalogEmptyRow>
      ) : (
        professors.map((professor, index) => (
          <ProfessorTableRow
            key={professor.id}
            professor={professor}
            lecturesById={lecturesById}
            isLast={index === professors.length - 1}
            mutating={mutating}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </CatalogTablePanel>
  )
}
