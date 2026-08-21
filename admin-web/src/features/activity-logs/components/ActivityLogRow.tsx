import { Badge, Text, type CSSProperties } from '@mantine/core'
import type { ActivityLog } from '../../../api/ActivityLogsService'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { activateOnEnterOrSpace } from '../../../utils/keyboard'
import { activityActionColor, activitySummary } from '../activityLogModel'

const cellStyle: CSSProperties = { padding: '14px 20px', verticalAlign: 'middle' }
const nowrapCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }

function rowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : '1px solid #1c2128',
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
      className="row-interactive row-clickable"
      style={rowStyle(isLast)}
      onClick={openDetails}
      onKeyDown={(event) => activateOnEnterOrSpace(event, openDetails)}
      tabIndex={0}
      aria-label={`Open activity ${enumLabel(activity.action)} by ${activity.actor.name}`}
    >
      <td style={nowrapCellStyle}>
        <Text size="xs" c="#6b7280">
          {formatDate(activity.createdAt, { withTime: true })}
        </Text>
      </td>
      <td style={cellStyle}>
        <Text size="sm" fw={600} c="#e2e8f0">
          {activity.actor.name}
        </Text>
        <Text size="xs" c="#4b5563">
          {activity.actor.email}
        </Text>
      </td>
      <td style={nowrapCellStyle}>
        <Badge variant="light" color={activityActionColor(activity.action)} size="sm">
          {enumLabel(activity.action)}
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
          {activitySummary(activity.metadata)}
        </Text>
      </td>
    </tr>
  )
}
