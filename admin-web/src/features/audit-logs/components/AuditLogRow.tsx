import { Badge, Text, type CSSProperties } from '@mantine/core'
import type { AuditLog } from '@/api/logs'
import { enumLabel } from '@/utils/enumLabel'
import { formatDate } from '@/utils/formatDate'
import { auditActionColor } from '@/constants/colors'
import { chrome } from '@/theme'
import ClickableRow from '@/components/ClickableRow'

const cellStyle: CSSProperties = { padding: '14px 20px', verticalAlign: 'middle' }
const nowrapCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }

function rowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : `1px solid ${chrome.borderSubtle}`,
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
    <ClickableRow
      style={rowStyle(isLast)}
      onActivate={openDetails}
      label={`Open audit event ${enumLabel(log.action)} by ${log.actor.name}`}
    >
      <td style={nowrapCellStyle}>
        <Text size="xs" c={chrome.textDim}>
          {formatDate(log.createdAt, { withTime: true })}
        </Text>
      </td>
      <td style={cellStyle}>
        <Text size="sm" fw={600} c={chrome.textPrimary}>
          {log.actor.name}
        </Text>
        <Text size="xs" c={chrome.textFaint}>
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
            <Text size="sm" c={chrome.textSecondary} lineClamp={1}>
              {log.target.label}
            </Text>
            <Text size="xs" c={chrome.textFaint}>
              {enumLabel(log.target.type)}
            </Text>
          </>
        ) : (
          <Text size="xs" c={chrome.textFaint}>
            —
          </Text>
        )}
      </td>
      <td style={cellStyle}>
        <Text size="xs" c={changedFields.length > 0 ? chrome.textMuted : chrome.textFaint}>
          {changedFields.length > 0 ? changedFields.map(enumLabel).join(', ') : 'No field changes'}
        </Text>
      </td>
    </ClickableRow>
  )
}
