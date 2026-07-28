import { Badge, Text, type CSSProperties } from '@mantine/core'
import type { ActivityLog } from '../../../api/ActivityLogsService'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { activateOnEnterOrSpace } from '../../../utils/keyboard'
import {
  activityTypeColor,
  actorEmail,
  actorName,
  contextSummary,
  outcomeColor,
} from '../activityLogModel'

const cellStyle: CSSProperties = { padding: '14px 20px', verticalAlign: 'middle' }
const nowrapCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }

function rowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : '1px solid #1c2128',
    cursor: 'pointer',
    transition: 'background 0.1s',
  }
}

interface ActivityLogRowProps {
  activity: ActivityLog
  isLast: boolean
  onOpen: (activity: ActivityLog) => void
}

export default function ActivityLogRow({ activity, isLast, onOpen }: ActivityLogRowProps) {
  const openDetails = () => onOpen(activity)

  return (
    <tr
      style={rowStyle(isLast)}
      onClick={openDetails}
      onKeyDown={(event) => activateOnEnterOrSpace(event, openDetails)}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = '#1c2128'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'transparent'
      }}
      tabIndex={0}
      aria-label={`Open activity ${enumLabel(activity.type)} by ${actorName(activity.actor)}`}
    >
      <td style={nowrapCellStyle}>
        <Text size="xs" c="#6b7280">
          {formatDate(activity.createdAt, { withTime: true })}
        </Text>
      </td>
      <td style={cellStyle}>
        <Text size="sm" fw={600} c="#e2e8f0">
          {actorName(activity.actor)}
        </Text>
        <Text size="xs" c="#4b5563">
          {actorEmail(activity.actor)}
        </Text>
      </td>
      <td style={nowrapCellStyle}>
        <Badge variant="light" color={activityTypeColor(activity.type)} size="sm">
          {enumLabel(activity.type)}
        </Badge>
      </td>
      <td style={cellStyle}>
        {activity.target ? (
          <>
            <Text size="sm" c="#cbd5e1" lineClamp={1}>
              {activity.target.label}
            </Text>
            <Text size="xs" c="#4b5563">
              {enumLabel(activity.target.type)}
            </Text>
          </>
        ) : (
          <Text size="xs" c="#4b5563">
            —
          </Text>
        )}
      </td>
      <td style={cellStyle}>
        <Text size="xs" c="#9ca3af" lineClamp={1}>
          {contextSummary(activity.context)}
        </Text>
      </td>
      <td style={nowrapCellStyle}>
        <Badge variant="light" color={outcomeColor(activity.outcome)} size="sm">
          {enumLabel(activity.outcome)}
        </Badge>
      </td>
    </tr>
  )
}
