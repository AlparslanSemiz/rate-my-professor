import { ActionIcon, Badge, Group, Text, Tooltip } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { MouseEvent } from 'react'
import type { Lecture } from '../../../api/CatalogService'
import { enumLabel } from '../../../utils/enumLabel'
import { activateOnEnterOrSpace } from '../../../utils/keyboard'
import { lectureLabel, lectureTerm, professorName } from '../catalogModel'
import {
  catalogCellStyle,
  catalogNowrapCellStyle,
  catalogRowStyle,
} from './catalogTableStyles'

interface LectureTableRowProps {
  lecture: Lecture
  isLast: boolean
  mutating: boolean
  onEdit: (lecture: Lecture) => void
  onDelete: (lecture: Lecture) => void
}

function keepFromRow(event: MouseEvent) {
  event.stopPropagation()
}

export default function LectureTableRow({
  lecture,
  isLast,
  mutating,
  onEdit,
  onDelete,
}: LectureTableRowProps) {
  return (
    <tr
      className="row-interactive row-clickable"
      style={catalogRowStyle(isLast)}
      onClick={() => onEdit(lecture)}
      onKeyDown={(event) => activateOnEnterOrSpace(event, () => onEdit(lecture))}
      tabIndex={0}
    >
      <td style={catalogCellStyle}>
        <Text size="sm" fw={500} c="#e2e8f0">
          {lecture.name}
        </Text>
        <Text size="xs" c="#6b7280">
          {lecture.code}
        </Text>
      </td>
      <td style={catalogNowrapCellStyle}>
        <Text size="sm" c="#9ca3af">
          {lectureTerm(lecture)}
        </Text>
      </td>
      <td style={catalogNowrapCellStyle}>
        <Text size="xs" c="#6b7280">
          {enumLabel(lecture.lectureType)}
        </Text>
      </td>
      <td style={catalogCellStyle}>
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
      <td style={catalogCellStyle}>
        <Badge color={lecture.active ? 'green' : 'gray'} variant="light" size="sm">
          {lecture.active ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td style={catalogCellStyle}>
        <Text size="sm" c="#9ca3af">
          {lecture.commentCount}
        </Text>
      </td>
      <td style={catalogCellStyle}>
        <Text size="sm" c="#9ca3af">
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
  )
}
