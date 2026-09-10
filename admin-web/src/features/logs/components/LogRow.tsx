import { Badge, Text, type CSSProperties } from '@mantine/core'
import type { AuditEntry } from '@/api/logs'
import { logEnumLabel } from '../logModel'
import type { LogScreen } from '../logScreen'
import { EMPTY_VALUE } from '@/utils/emptyValue'
import { formatDate } from '@/utils/formatDate'
import { chrome } from '@/theme'
import ClickableRow from '@/components/ClickableRow'
import { tableCellPadding } from '@/constants/layout'

const cellStyle: CSSProperties = { padding: tableCellPadding, verticalAlign: 'middle' }
const nowrapCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }

function rowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : `1px solid ${chrome.borderSubtle}`,
  }
}

interface LogRowProps<TEntry extends AuditEntry> {
  screen: LogScreen<TEntry>
  entry: TEntry
  isLast: boolean
  onOpen: (entry: TEntry) => void
}

/**
 * One row of either log.
 *
 * Every value here came off the wire and none of it was validated, which is why the action and
 * the target type go through `logEnumLabel` and the badge colour through the screen's guarded
 * `actionColor` rather than through `enumLabel` and a lookup — `F-028` was this row taking the
 * whole screen down on an action it had never seen.
 */
export default function LogRow<TEntry extends AuditEntry>({
  screen,
  entry,
  isLast,
  onOpen,
}: LogRowProps<TEntry>) {
  const openDetails = () => onOpen(entry)
  const summary = screen.summarise(entry)

  return (
    <ClickableRow
      style={rowStyle(isLast)}
      onActivate={openDetails}
      label={`Open ${screen.noun.toLowerCase()} event ${logEnumLabel(entry.action)} by ${entry.actor.name}`}
    >
      <td style={nowrapCellStyle}>
        <Text size="xs" c={chrome.textDim}>
          {formatDate(entry.createdAt, { withTime: true })}
        </Text>
      </td>
      <td style={cellStyle}>
        <Text size="sm" fw={600} c={chrome.textPrimary}>
          {entry.actor.name}
        </Text>
        <Text size="xs" c={chrome.textFaint}>
          {entry.actor.email}
        </Text>
      </td>
      <td style={nowrapCellStyle}>
        <Badge variant="light" color={screen.actionColor(entry.action)} size="sm">
          {logEnumLabel(entry.action)}
        </Badge>
      </td>
      <td style={cellStyle}>
        {entry.target ? (
          <>
            <Text size="sm" c={chrome.textSecondary} lineClamp={1}>
              {entry.target.label}
            </Text>
            <Text size="xs" c={chrome.textFaint}>
              {logEnumLabel(entry.target.type)}
            </Text>
          </>
        ) : (
          <Text size="xs" c={chrome.textFaint}>
            {EMPTY_VALUE}
          </Text>
        )}
      </td>
      <td style={cellStyle}>
        <Text size="xs" c={summary === null ? chrome.textFaint : chrome.textMuted}>
          {summary ?? screen.emptySummary}
        </Text>
      </td>
    </ClickableRow>
  )
}
