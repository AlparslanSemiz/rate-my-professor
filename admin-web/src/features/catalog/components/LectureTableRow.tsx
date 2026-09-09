import { ActionIcon, Badge, Group, Text, Tooltip } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { Lecture } from '@/api/catalog'
import { enumLabel } from '@/utils/enumLabel'
import { lectureLabel, lectureTerm, professorName } from '../model'
import {
  catalogCellStyle,
  catalogNowrapCellStyle,
  catalogRowStyle,
} from './catalogTableStyles'
import { chrome, iconSize } from '@/theme'
import { activeStatusColor } from '@/constants/colors'
import ClickableRow from '@/components/ClickableRow'
import { keepFromRow } from '@/components/rowActivation'

interface LectureTableRowProps {
  lecture: Lecture
  isLast: boolean
  mutating: boolean
  onEdit: (lecture: Lecture) => void
  onDelete: (lecture: Lecture) => void
}

export default function LectureTableRow({
  lecture,
  isLast,
  mutating,
  onEdit,
  onDelete,
}: LectureTableRowProps) {
  return (
    <ClickableRow
      style={catalogRowStyle(isLast)}
      onActivate={() => onEdit(lecture)}
      label={`Edit ${lectureLabel(lecture)}`}
    >
      <td style={catalogCellStyle}>
        <Text size="sm" fw={500} c={chrome.textPrimary}>
          {lecture.name}
        </Text>
        <Text size="xs" c={chrome.textDim}>
          {lecture.code}
        </Text>
      </td>
      <td style={catalogNowrapCellStyle}>
        <Text size="sm" c={chrome.textMuted}>
          {lectureTerm(lecture)}
        </Text>
      </td>
      <td style={catalogNowrapCellStyle}>
        <Text size="xs" c={chrome.textDim}>
          {enumLabel(lecture.lectureType)}
        </Text>
      </td>
      <td style={catalogCellStyle}>
        {lecture.professors.length === 0 ? (
          <Text size="xs" c={chrome.iconFaint}>
            Unassigned
          </Text>
        ) : (
          <Text size="sm" c={chrome.textMuted} lineClamp={2}>
            {lecture.professors.map(professorName).join(', ')}
          </Text>
        )}
      </td>
      <td style={catalogCellStyle}>
        <Badge color={activeStatusColor[lecture.active ? 'active' : 'inactive']} variant="light" size="sm">
          {lecture.active ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td style={catalogCellStyle}>
        <Text size="sm" c={chrome.textMuted}>
          {lecture.commentCount}
        </Text>
      </td>
      <td style={catalogCellStyle}>
        <Text size="sm" c={chrome.textMuted}>
          {lecture.ratingCount}
        </Text>
      </td>
      <td style={catalogNowrapCellStyle} onClick={keepFromRow}>
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
              <IconPencil size={iconSize.rowAction} />
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
              <IconTrash size={iconSize.rowAction} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </td>
    </ClickableRow>
  )
}
