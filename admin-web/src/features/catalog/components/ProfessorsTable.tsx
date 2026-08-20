import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Text,
  TextInput,
  Tooltip,
  type CSSProperties,
} from '@mantine/core'
import { IconPencil, IconSearch, IconTrash, IconUserStar } from '@tabler/icons-react'
import type { Lecture, Professor } from '../../../api/CatalogService'
import Panel from '../../../components/Panel'
import TableHeaderRow from '../../../components/TableHeaderRow'
import { darkInputStyles } from '../../../constants/inputStyles'
import { formatAverageRating, lectureLabel, professorName } from '../catalogModel'

const TABLE_COLUMNS = ['Professor', 'Lectures', 'Status', 'Average rating', 'Ratings', ''] as const

const panelStyle: CSSProperties = { overflow: 'hidden' }
const headerStyle: CSSProperties = { borderBottom: '1px solid #21262d' }
const searchInputStyle: CSSProperties = { flex: '1 1 240px', maxWidth: 320 }
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 860 }
const cellStyle: CSSProperties = { padding: '14px 20px' }
const nowrapCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }
const emptyCellStyle: CSSProperties = { padding: '40px 20px', textAlign: 'center' }

function rowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : '1px solid #1c2128' }
}

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
    <Panel style={panelStyle}>
      <Box px={20} py={16} style={headerStyle}>
        <Group justify="space-between">
          <div>
            <Group gap={6}>
              <IconUserStar size={14} color="#6b7280" />
              <Text fw={600} c="#e2e8f0" size="sm">
                Professors
              </Text>
            </Group>
            <Text size="xs" c="#4b5563">
              {professors.length} of {totalCount} in the catalogue
            </Text>
          </div>
          <TextInput
            placeholder="Search by name..."
            value={search}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            style={searchInputStyle}
            size="sm"
            aria-label="Search professors"
            leftSection={<IconSearch size={14} color="#6b7280" />}
            styles={darkInputStyles}
          />
        </Group>
      </Box>

      <div style={tableScrollStyle}>
        <table style={tableStyle}>
          <TableHeaderRow columns={TABLE_COLUMNS} />
          <tbody>
            {professors.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length} style={emptyCellStyle}>
                  <Text c="#4b5563" size="sm">
                    No professors found.
                  </Text>
                </td>
              </tr>
            ) : (
              professors.map((professor, index) => {
                const assigned = professor.lectureIds
                  .map((id) => lecturesById.get(id))
                  .filter((lecture): lecture is Lecture => lecture !== undefined)

                return (
                  <tr key={professor.id} style={rowStyle(index === professors.length - 1)}>
                    <td style={cellStyle}>
                      <Text size="sm" fw={500} c="#e2e8f0">
                        {professorName(professor)}
                      </Text>
                    </td>
                    <td style={cellStyle}>
                      {assigned.length === 0 ? (
                        <Text size="xs" c="#374151">
                          None assigned
                        </Text>
                      ) : (
                        <Text size="sm" c="#9ca3af" lineClamp={2}>
                          {assigned.map(lectureLabel).join(', ')}
                        </Text>
                      )}
                    </td>
                    <td style={cellStyle}>
                      <Badge color={professor.active ? 'green' : 'gray'} variant="light" size="sm">
                        {professor.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td style={cellStyle}>
                      <Text size="sm" c="#9ca3af">
                        {formatAverageRating(professor.averageRating, professor.ratingCount)}
                      </Text>
                    </td>
                    <td style={cellStyle}>
                      <Text size="sm" c="#9ca3af">
                        {professor.ratingCount}
                      </Text>
                    </td>
                    <td style={nowrapCellStyle}>
                      <Group gap={4} wrap="nowrap">
                        <Tooltip label="Edit professor" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            size="sm"
                            disabled={mutating}
                            aria-label={`Edit ${professorName(professor)}`}
                            onClick={() => onEdit(professor)}
                          >
                            <IconPencil size={15} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete professor — the lectures stay" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            disabled={mutating}
                            aria-label={`Delete ${professorName(professor)}`}
                            onClick={() => onDelete(professor)}
                          >
                            <IconTrash size={15} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
