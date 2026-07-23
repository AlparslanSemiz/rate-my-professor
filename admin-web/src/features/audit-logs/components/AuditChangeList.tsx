import { Box, Group, Stack, Text, type CSSProperties } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import type { AuditChange } from '../../../api/AuditLogsService'
import { enumLabel } from '../../../utils/enumLabel'
import { formatAuditValue } from '../auditLogModel'

const cardStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  background: '#0f1117',
  border: '1px solid #21262d',
}
const valueStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '9px 10px',
  borderRadius: 8,
  background: '#0b0d12',
  border: '1px solid #1c2128',
  wordBreak: 'break-word',
}

export default function AuditChangeList({
  changes,
}: {
  changes: Record<string, AuditChange>
}) {
  const entries = Object.entries(changes)

  if (entries.length === 0) {
    return (
      <Text size="sm" c="#4b5563">
        No field changes recorded.
      </Text>
    )
  }

  return (
    <Stack gap={8}>
      {entries.map(([field, change]) => (
        <Box key={field} style={cardStyle}>
          <Text size="xs" fw={600} c="#9ca3af" mb={8}>
            {enumLabel(field)}
          </Text>
          <Group gap={8} wrap="nowrap" align="stretch">
            <ChangeValue label="Before" color="#fca5a5" value={formatAuditValue(change.before)} />
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <IconArrowRight size={15} color="#4b5563" />
            </Box>
            <ChangeValue label="After" color="#86efac" value={formatAuditValue(change.after)} />
          </Group>
        </Box>
      ))}
    </Stack>
  )
}

function ChangeValue({ label, color, value }: { label: string; color: string; value: string }) {
  return (
    <Box style={valueStyle}>
      <Text size="xs" c="#4b5563">
        {label}
      </Text>
      <Text size="sm" c={color}>
        {value}
      </Text>
    </Box>
  )
}
