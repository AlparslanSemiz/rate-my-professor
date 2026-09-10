import { ActionIcon, Badge, Group, Text, Tooltip } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { Lecture, Professor } from '@/api/catalog'
import { formatAverageRating, lectureLabel, professorName } from '../model'
import {
  catalogCellStyle,
  catalogNowrapCellStyle,
  catalogRowStyle,
} from './catalogTableStyles'
import { chrome, iconSize } from '@/theme'
import { activeStatusColor } from '@/constants/colors'
import ClickableRow from '@/components/ClickableRow'
import { keepFromRow } from '@/components/rowActivation'

interface ProfessorTableRowProps {
  professor: Professor
  lecturesById: Map<string, Lecture>
  isLast: boolean
  mutating: boolean
  onEdit: (professor: Professor) => void
  onDelete: (professor: Professor) => void
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
    <ClickableRow
      style={catalogRowStyle(isLast)}
      onActivate={() => onEdit(professor)}
      label={`Edit ${professorName(professor)}`}
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
        <Badge color={activeStatusColor[professor.active ? 'active' : 'inactive']} variant="light" size="sm">
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
              <IconPencil size={iconSize.rowAction} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete professor (the lectures stay)" withArrow>
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              disabled={mutating}
              aria-label={`Delete ${professorName(professor)}`}
              onClick={() => onDelete(professor)}
            >
              <IconTrash size={iconSize.rowAction} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </td>
    </ClickableRow>
  )
}
