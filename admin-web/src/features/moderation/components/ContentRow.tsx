import type { MouseEvent } from 'react'
import { Badge, Text } from '@mantine/core'
import UserChip from '@/components/UserChip'
import { contentStatusColor } from '@/constants/colors'
import { chrome } from '@/theme'
import { enumLabel } from '@/utils/enumLabel'
import { formatDate } from '@/utils/formatDate'
import { activateOnEnterOrSpace } from '@/utils/keyboard'
import type { ModeratedItem } from '../model'
import ContentCell from './ContentCell'
import ContentRowActions from './ContentRowActions'
import { cellStyle, contentCellStyle, nowrapCellStyle, rowStyle } from './contentRowStyles'

interface ContentRowProps {
  item: ModeratedItem
  isLast: boolean
  updating: boolean
  onOpenProfile: (userId: string) => void
  onEdit: (item: ModeratedItem) => void
  onDelete: (item: ModeratedItem) => void
  /** Renders this row indented, as an answer nested under its comment. */
  isReply?: boolean
  expanded?: boolean
  /** Present only for a comment that has answers; toggles their visibility below this row. */
  onToggleExpand?: () => void
}

export default function ContentRow({
  item,
  isLast,
  updating,
  onOpenProfile,
  onEdit,
  onDelete,
  isReply = false,
  expanded = false,
  onToggleExpand,
}: ContentRowProps) {
  const openEditor = () => onEdit(item)

  // Every control sitting inside the row has its own job; without this, pressing Delete or
  // expanding a thread would also open the editor behind the dialog.
  function keepFromRow(event: MouseEvent) {
    event.stopPropagation()
  }

  return (
    <tr
      className={
        isReply ? 'row-interactive row-clickable row-reply' : 'row-interactive row-clickable'
      }
      style={rowStyle(isLast)}
      onClick={openEditor}
      onKeyDown={(event) => activateOnEnterOrSpace(event, openEditor)}
      tabIndex={0}
    >
      <td style={contentCellStyle}>
        <ContentCell
          item={item}
          isReply={isReply}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
          onStopRowClick={keepFromRow}
        />
      </td>
      <td style={nowrapCellStyle} onClick={keepFromRow}>
        <UserChip
          id={item.author.id}
          name={item.author.name}
          role={item.author.role}
          warningCount={item.author.warnings}
          status={item.author.status}
          onClick={onOpenProfile}
        />
      </td>
      <td style={cellStyle}>
        <Text size="sm" c={chrome.textMuted} lineClamp={1}>
          {item.postContext}
        </Text>
      </td>
      <td style={cellStyle}>
        <Badge color={contentStatusColor[item.status]} variant="light" size="sm">
          {enumLabel(item.status)}
        </Badge>
      </td>
      <td style={cellStyle}>
        {item.reports > 0 ? (
          <Badge color="red" variant="light" size="sm">
            {item.reports}
          </Badge>
        ) : (
          <Text size="xs" c={chrome.iconFaint}>
            —
          </Text>
        )}
      </td>
      <td style={nowrapCellStyle}>
        <Text size="xs" c={chrome.textDim}>
          {formatDate(item.createdAt, { withTime: true })}
        </Text>
      </td>
      <td style={nowrapCellStyle} onClick={keepFromRow}>
        <ContentRowActions
          item={item}
          updating={updating}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </td>
    </tr>
  )
}
