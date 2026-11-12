import { Badge, Box, Group, Text } from '@mantine/core'
import type { AuditEntry } from '@/api/logs'
import { chrome } from '@/theme'
import { logEnumLabel } from '../../logModel'
import { formatDate } from '@/utils/formatDate'
import { detailCardStyle } from '@/components/detailStyles'

interface ActorSummaryProps {
  entry: AuditEntry
  /** The screen's own colour rule, so this file does not have to know which log it is in. */
  actionColor: (action: unknown) => string
}

/** Who did what, and when — the header of a log entry's details. */
export default function ActorSummary({ entry, actionColor }: ActorSummaryProps) {
  return (
    <Box style={detailCardStyle}>
      <Group justify="space-between" align="flex-start">
        <div>
          <Badge variant="light" color={actionColor(entry.action)} mb={8}>
            {logEnumLabel(entry.action)}
          </Badge>
          <Text fw={600} c={chrome.textPrimary}>
            {entry.actor.name}
          </Text>
          <Text size="xs" c={chrome.textDim}>
            {entry.actor.email} · {logEnumLabel(entry.actor.role)}
          </Text>
        </div>
        <Text size="xs" c={chrome.textDim}>
          {formatDate(entry.createdAt, { withTime: true })}
        </Text>
      </Group>
    </Box>
  )
}
