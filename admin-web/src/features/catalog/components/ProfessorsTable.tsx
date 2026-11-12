import { Text } from '@mantine/core'
import { IconUserStar } from '@tabler/icons-react'
import type { Lecture, Professor } from '@/api/catalog'
import CatalogTablePanel, { CatalogEmptyRow } from './CatalogTablePanel'
import ProfessorTableRow from './ProfessorTableRow'
import { chrome, iconSize } from '@/theme'

const TABLE_COLUMNS = ['Professor', 'Lectures', 'Status', 'Average rating', 'Ratings', ''] as const

interface ProfessorsTableProps {
  professors: Professor[]
  totalCount: number
  mutating: boolean
  lecturesById: Map<string, Lecture>
  onEdit: (professor: Professor) => void
  onDelete: (professor: Professor) => void
}

export default function ProfessorsTable({
  professors,
  totalCount,
  mutating,
  lecturesById,
  onEdit,
  onDelete,
}: ProfessorsTableProps) {
  return (
    <CatalogTablePanel
      title="Professors"
      icon={<IconUserStar size={iconSize.inline} color={chrome.textDim} />}
      description={`${professors.length} of ${totalCount} in the catalogue`}
      columns={TABLE_COLUMNS}
      minWidth={860}
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
