import { ActionIcon, Badge, Group, Text, Tooltip } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { MouseEvent } from 'react'
import type { Lecture, Professor } from '@/api/catalog'
import { activateOnEnterOrSpace } from '@/utils/keyboard'
import { formatAverageRating, lectureLabel, professorName } from '../catalogModel'
import {
  catalogCellStyle,
  catalogNowrapCellStyle,
  catalogRowStyle,
} from './catalogTableStyles'
import { chrome } from '@/theme'

interface ProfessorTableRowProps {
  professor: Professor
  lecturesById: Map<string, Lecture>
  isLast: boolean
  mutating: boolean
  onEdit: (professor: Professor) => void
  onDelete: (professor: Professor) => void
}

function keepFromRow(event: MouseEvent) {
  event.stopPropagation()
}

export default function ProfessorTableRow({
  professor,
  lecturesById,
  isLast,
  mutating,
  onEdit,
  onDelete,
}: ProfessorTableRowProps) {
  const assigned = professor.lectureIds
    .map((id) => lecturesById.get(id))
    .filter((lecture): lecture is Lecture => lecture !== undefined)

  return (
    <tr
      className="row-interactive row-clickable"
      style={catalogRowStyle(isLast)}
      onClick={() => onEdit(professor)}
      onKeyDown={(event) => activateOnEnterOrSpace(event, () => onEdit(professor))}
      tabIndex={0}
    >
      <td style={catalogCellStyle}>
        <Text size="sm" fw={500} c={chrome.textPrimary}>
          {professorName(professor)}
        </Text>
      </td>
      <td style={catalogCellStyle}>
        {assigned.length === 0 ? (
          <Text size="xs" c={chrome.iconFaint}>
            None assigned
          </Text>
        ) : (
          <Text size="sm" c={chrome.textMuted} lineClamp={2}>
            {assigned.map(lectureLabel).join(', ')}
          </Text>
        )}
      </td>
      <td style={catalogCellStyle}>
        <Badge color={professor.active ? 'green' : 'gray'} variant="light" size="sm">
          {professor.active ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td style={catalogCellStyle}>
        <Text size="sm" c={chrome.textMuted}>
          {formatAverageRating(professor.averageRating, professor.ratingCount)}
        </Text>
      </td>
      <td style={catalogCellStyle}>
        <Text size="sm" c={chrome.textMuted}>
          {professor.ratingCount}
        </Text>
      </td>
      <td style={catalogNowrapCellStyle} onClick={keepFromRow}>
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
}
