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
import { IconPencil, IconSchool, IconSearch, IconTrash } from '@tabler/icons-react'
import type { MouseEvent } from 'react'
import type { Lecture } from '../../../api/CatalogService'
import Panel from '../../../components/Panel'
import TableHeaderRow from '../../../components/TableHeaderRow'
import { darkInputStyles } from '../../../constants/inputStyles'
import { enumLabel } from '../../../utils/enumLabel'
import { activateOnEnterOrSpace } from '../../../utils/keyboard'
import { lectureLabel, lectureTerm, professorName } from '../catalogModel'

const TABLE_COLUMNS = ['Lecture', 'Term', 'Type', 'Professors', 'Status', 'Comments', 'Ratings', ''] as const

const panelStyle: CSSProperties = { overflow: 'hidden' }
const headerStyle: CSSProperties = { borderBottom: '1px solid #21262d' }
const searchInputStyle: CSSProperties = { flex: '1 1 240px', maxWidth: 320 }
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 1000 }
const cellStyle: CSSProperties = { padding: '14px 20px' }
const nowrapCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }
const emptyCellStyle: CSSProperties = { padding: '40px 20px', textAlign: 'center' }

function rowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : '1px solid #1c2128' }
}

/** The action buttons are their own controls; a press on one must not also open the editor. */
function keepFromRow(event: MouseEvent) {
  event.stopPropagation()
}

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
    <Panel style={panelStyle}>
      <Box px={20} py={16} style={headerStyle}>
        <Group justify="space-between">
          <div>
            <Group gap={6}>
              <IconSchool size={14} color="#6b7280" />
              <Text fw={600} c="#e2e8f0" size="sm">
                Lectures
              </Text>
            </Group>
            <Text size="xs" c="#4b5563">
              {lectures.length} of {totalCount} in the catalogue
            </Text>
          </div>
          <TextInput
            placeholder="Search by name, code, or professor..."
            value={search}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
            style={searchInputStyle}
            size="sm"
            aria-label="Search lectures"
            leftSection={<IconSearch size={14} color="#6b7280" />}
            styles={darkInputStyles}
          />
        </Group>
      </Box>

      <div style={tableScrollStyle}>
        <table style={tableStyle}>
          <TableHeaderRow columns={TABLE_COLUMNS} />
          <tbody>
            {lectures.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length} style={emptyCellStyle}>
                  <Text c="#4b5563" size="sm">
                    No lectures found.
                  </Text>
                </td>
              </tr>
            ) : (
              lectures.map((lecture, index) => (
                <tr
                  key={lecture.id}
                  className="row-interactive row-clickable"
                  style={rowStyle(index === lectures.length - 1)}
                  onClick={() => onEdit(lecture)}
                  onKeyDown={(event) => activateOnEnterOrSpace(event, () => onEdit(lecture))}
                  tabIndex={0}
                >
                  <td style={cellStyle}>
                    <Text size="sm" fw={500} c="#e2e8f0">
                      {lecture.name}
                    </Text>
                    <Text size="xs" c="#6b7280">
                      {lecture.code}
                    </Text>
                  </td>
                  <td style={nowrapCellStyle}>
                    <Text size="sm" c="#9ca3af">
                      {lectureTerm(lecture)}
                    </Text>
                  </td>
                  <td style={nowrapCellStyle}>
                    <Text size="xs" c="#6b7280">
                      {enumLabel(lecture.lectureType)}
                    </Text>
                  </td>
                  <td style={cellStyle}>
                    {lecture.professors.length === 0 ? (
                      <Text size="xs" c="#374151">
                        Unassigned
                      </Text>
                    ) : (
                      <Text size="sm" c="#9ca3af" lineClamp={2}>
                        {lecture.professors.map(professorName).join(', ')}
                      </Text>
                    )}
                  </td>
                  <td style={cellStyle}>
                    <Badge
                      color={lecture.active ? 'green' : 'gray'}
                      variant="light"
                      size="sm"
                    >
                      {lecture.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={cellStyle}>
                    <Text size="sm" c="#9ca3af">
                      {lecture.commentCount}
                    </Text>
                  </td>
                  <td style={cellStyle}>
                    <Text size="sm" c="#9ca3af">
                      {lecture.ratingCount}
                    </Text>
                  </td>
                  <td style={nowrapCellStyle} onClick={keepFromRow}>
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="Edit lecture" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          size="sm"
                          disabled={mutating}
                          aria-label={`Edit ${lectureLabel(lecture)}`}
                          onClick={() => onEdit(lecture)}
                        >
                          <IconPencil size={15} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete lecture and everything posted under it" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          disabled={mutating}
                          aria-label={`Delete ${lectureLabel(lecture)}`}
                          onClick={() => onDelete(lecture)}
                        >
                          <IconTrash size={15} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
