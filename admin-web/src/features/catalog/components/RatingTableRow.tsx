import { ActionIcon, Text, Tooltip } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { type Lecture, type Rating } from '@/api/catalog'
import { enumLabel } from '@/utils/enumLabel'
import { formatDate } from '@/utils/formatDate'
import { lectureLabel } from '../catalogModel'
import {
  catalogCellStyle,
  catalogNowrapCellStyle,
  catalogRowStyle,
} from './catalogTableStyles'
import { chrome } from '@/theme'

interface RatingTableRowProps {
  rating: Rating
  lecture?: Lecture
  isLast: boolean
  busy: boolean
  onDelete: (rating: Rating) => void
}

function scoreLine(scores: Record<string, number>): string {
  const entries = Object.entries(scores)
  if (entries.length === 0) return '—'
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
          {lecture ? lectureLabel(lecture) : '—'}
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
          {rating.createdAt ? formatDate(rating.createdAt) : '—'}
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
            <IconTrash size={15} />
          </ActionIcon>
        </Tooltip>
      </td>
    </tr>
  )
}
