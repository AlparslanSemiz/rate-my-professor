import { ActionIcon, Badge, Group, Text, Tooltip, type CSSProperties } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import UserChip from '../../../components/UserChip'
import { contentStatusColor } from '../../../constants/colors'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import type { ModeratedItem } from '../moderationModel'

const TOOLTIP_THRESHOLD = 90

const contentCellStyle: CSSProperties = { padding: '16px 20px', maxWidth: 360 }
const cellStyle: CSSProperties = { padding: '16px 20px' }
const nowrapCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }
const breakWordStyle: CSSProperties = { wordBreak: 'break-word' }

function rowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : '1px solid #1c2128' }
}

interface ContentRowProps {
  item: ModeratedItem
  isLast: boolean
  updating: boolean
  onOpenProfile: (userId: string) => void
  onEdit: (item: ModeratedItem) => void
  onDelete: (item: ModeratedItem) => void
}

export default function ContentRow({
  item,
  isLast,
  updating,
  onOpenProfile,
  onEdit,
  onDelete,
}: ContentRowProps) {
  const hasTooltip = item.content.length > TOOLTIP_THRESHOLD

  return (
    <tr
      style={rowStyle(isLast)}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = '#1c2128'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'transparent'
      }}
    >
      <td style={contentCellStyle}>
        <Tooltip label={item.content} multiline w={360} withArrow disabled={!hasTooltip}>
          <Text
            size="sm"
            c="#d1d5db"
            lineClamp={2}
            style={{ ...breakWordStyle, cursor: hasTooltip ? 'help' : 'default' }}
          >
            {item.content}
          </Text>
        </Tooltip>
        <Text size="xs" c="#4b5563" mt={4} lineClamp={1} style={breakWordStyle}>
          {item.detail}
        </Text>
      </td>
      <td style={nowrapCellStyle}>
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
        <Text size="sm" c="#9ca3af" lineClamp={1}>
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
          <Text size="xs" c="#374151">
            —
          </Text>
        )}
      </td>
      <td style={nowrapCellStyle}>
        <Text size="xs" c="#6b7280">
          {formatDate(item.createdAt, { withTime: true })}
        </Text>
      </td>
      <td style={nowrapCellStyle}>
        <Group gap={4} wrap="nowrap">
          <Tooltip label="Edit text or visibility" withArrow>
            <ActionIcon
              variant="subtle"
              color="blue"
              size="sm"
              disabled={updating}
              aria-label={`Edit content by ${item.author.name}`}
              onClick={() => onEdit(item)}
            >
              <IconPencil size={15} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete permanently" withArrow>
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              disabled={updating}
              aria-label={`Delete content by ${item.author.name}`}
              onClick={() => onDelete(item)}
            >
              <IconTrash size={15} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </td>
    </tr>
  )
}
