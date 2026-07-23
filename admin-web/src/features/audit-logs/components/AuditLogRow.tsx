import { Badge, Text, type CSSProperties } from '@mantine/core'
import type { AuditLog } from '../../../api/AuditLogsService'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { activateOnEnterOrSpace } from '../../../utils/keyboard'
import { auditActionColor } from '../auditLogModel'

const cellStyle: CSSProperties = { padding: '14px 20px', verticalAlign: 'middle' }
const nowrapCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }

function rowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : '1px solid #1c2128',
    cursor: 'pointer',
    transition: 'background 0.1s',
  }
}

interface AuditLogRowProps {
  log: AuditLog
  isLast: boolean
  onOpen: (log: AuditLog) => void
}

export default function AuditLogRow({ log, isLast, onOpen }: AuditLogRowProps) {
  const openDetails = () => onOpen(log)
  const changedFields = Object.keys(log.changes)

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
      aria-label={`Open audit event ${enumLabel(log.action)} by ${log.actor.name}`}
    >
      <td style={nowrapCellStyle}>
        <Text size="xs" c="#6b7280">
          {formatDate(log.createdAt, { withTime: true })}
        </Text>
      </td>
      <td style={cellStyle}>
        <Text size="sm" fw={600} c="#e2e8f0">
          {log.actor.name}
        </Text>
        <Text size="xs" c="#4b5563">
          {log.actor.email}
        </Text>
      </td>
      <td style={nowrapCellStyle}>
        <Badge variant="light" color={auditActionColor(log.action)} size="sm">
          {enumLabel(log.action)}
        </Badge>
      </td>
      <td style={cellStyle}>
        {log.target ? (
          <>
            <Text size="sm" c="#cbd5e1" lineClamp={1}>
              {log.target.label}
            </Text>
            <Text size="xs" c="#4b5563">
              {enumLabel(log.target.type)}
            </Text>
          </>
        ) : (
          <Text size="xs" c="#4b5563">
            —
          </Text>
        )}
      </td>
      <td style={cellStyle}>
        <Text size="xs" c={changedFields.length > 0 ? '#9ca3af' : '#4b5563'}>
          {changedFields.length > 0 ? changedFields.map(enumLabel).join(', ') : 'No field changes'}
        </Text>
      </td>
    </tr>
  )
}
