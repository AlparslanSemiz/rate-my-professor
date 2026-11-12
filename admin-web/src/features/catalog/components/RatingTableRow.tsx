import { ActionIcon, Text, Tooltip } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import ClickableRow from '@/components/ClickableRow'
import { keepFromRow } from '@/components/rowActivation'
import { type Lecture, type Rating } from '@/api/catalog'
import { enumLabel } from '@/utils/enumLabel'
import { formatDate } from '@/utils/formatDate'
import { lectureLabel } from '../model'
import {
  catalogActionCellStyle,
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
  onOpen: (rating: Rating) => void
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
  onOpen,
  onDelete,
}: RatingTableRowProps) {
  return (
    // `F-083`: this row and the report row were the two in the panel that answered a click
    // with nothing. It opens a read-only view - there is no rating editor to open, by
    // contract - so the label says "open" rather than "edit".
    <ClickableRow
      style={catalogRowStyle(isLast)}
      onActivate={() => onOpen(rating)}
      label={`Open the rating by ${rating.authorName}`}
    >
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
      {/* `F-087`: the last column is wider than one icon, so the control is pushed to the
          cell's own padding and ends where every other row's actions end. */}
      <td style={catalogActionCellStyle} onClick={keepFromRow}>
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
    </ClickableRow>
  )
}
