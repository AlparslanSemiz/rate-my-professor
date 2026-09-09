import { Badge, Box, Group, Text } from '@mantine/core'
import type { AuditLog } from '@/api/logs'
import { chrome } from '@/theme'
import { enumLabel } from '@/utils/enumLabel'
import { formatDate } from '@/utils/formatDate'
import { auditActionColor } from '@/constants/colors'
import { detailCardStyle } from './detailStyles'

/** Who did what, and when — the header of an audit entry's details. */
export default function ActorSummary({ log }: { log: AuditLog }) {
  return (
    <Box style={detailCardStyle}>
      <Group justify="space-between" align="flex-start">
        <div>
          <Badge variant="light" color={auditActionColor(log.action)} mb={8}>
            {enumLabel(log.action)}
          </Badge>
          <Text fw={600} c={chrome.textPrimary}>
            {log.actor.name}
          </Text>
          <Text size="xs" c={chrome.textDim}>
            {log.actor.email} · {enumLabel(log.actor.role)}
          </Text>
        </div>
        <Text size="xs" c={chrome.textDim}>
          {formatDate(log.createdAt, { withTime: true })}
        </Text>
      </Group>
    </Box>
  )
}
