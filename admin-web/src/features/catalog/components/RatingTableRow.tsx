import { ActionIcon, Text, Tooltip } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { type Lecture, type Rating } from '@/api/catalog'
import { enumLabel } from '@/utils/enumLabel'
import { formatDate } from '@/utils/formatDate'
import { lectureLabel } from '../model'
import {
  catalogCellStyle,
  catalogNowrapCellStyle,
  catalogRowStyle,
} from './catalogTableStyles'
import { chrome, iconSize } from '@/theme'
import { EMPTY_VALUE } from '@/utils/emptyValue'

interface RatingTableRowProps {
  rating: Rating
  lecture?: Lecture
  isLast: boolean
  busy: boolean
  onDelete: (rating: Rating) => void
}

function scoreLine(scores: Record<string, number>): string {
  const entries = Object.entries(scores)
  if (entries.length === 0) return EMPTY_VALUE
  return entries.map(([category, score]) => `${enumLabel(category)} ${score}`).join(' · ')
}

export default function RatingTableRow({
  rating,
  lecture,
  isLast,
  busy,
  onDelete,
}: RatingTableRowProps) {
  return (
    <tr style={catalogRowStyle(isLast)}>
      <td style={catalogCellStyle}>
        <Text size="sm" c={chrome.textPrimary}>
          {lecture ? lectureLabel(lecture) : EMPTY_VALUE}
        </Text>
      </td>
      <td style={catalogCellStyle}>
        <Text size="xs" c={chrome.textMuted}>
          {scoreLine(rating.scores)}
        </Text>
      </td>
      <td style={catalogNowrapCellStyle}>
        <Text size="sm" c={chrome.textMuted}>
          {rating.authorName}
        </Text>
      </td>
      <td style={catalogNowrapCellStyle}>
        <Text size="xs" c={chrome.textDim}>
          {rating.createdAt ? formatDate(rating.createdAt) : EMPTY_VALUE}
        </Text>
      </td>
      <td style={catalogCellStyle}>
        <Tooltip label="Remove this rating" withArrow>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            disabled={busy}
            aria-label={`Delete rating by ${rating.authorName}`}
            onClick={() => onDelete(rating)}
          >
            <IconTrash size={iconSize.rowAction} />
          </ActionIcon>
        </Tooltip>
      </td>
    </tr>
  )
}
