import { ActionIcon, Text, Tooltip } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import type { Lecture } from '../../../api/CatalogService'
import type { Rating } from '../../../api/RatingsService'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { lectureLabel } from '../catalogModel'
import {
  catalogCellStyle,
  catalogNowrapCellStyle,
  catalogRowStyle,
} from './catalogTableStyles'

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
        <Text size="sm" c="#e2e8f0">
          {lecture ? lectureLabel(lecture) : '—'}
        </Text>
      </td>
      <td style={catalogCellStyle}>
        <Text size="xs" c="#9ca3af">
          {scoreLine(rating.scores)}
        </Text>
      </td>
      <td style={catalogNowrapCellStyle}>
        <Text size="sm" c="#9ca3af">
          {rating.authorName}
        </Text>
      </td>
      <td style={catalogNowrapCellStyle}>
        <Text size="xs" c="#6b7280">
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
