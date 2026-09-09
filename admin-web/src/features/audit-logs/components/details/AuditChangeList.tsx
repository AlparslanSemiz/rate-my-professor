import { Box, Group, Stack, Text, type CSSProperties } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import type { AuditChange } from '@/api/logs'
import { enumLabel } from '@/utils/enumLabel'
import { formatAuditValue } from '../../auditLogModel'
import { chrome } from '@/theme'
import { KIT } from '@/constants/colors'

const cardStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  background: chrome.surfaceSunken,
  border: `1px solid ${chrome.border}`,
}
const valueStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '9px 10px',
  borderRadius: 8,
  background: chrome.well,
  border: `1px solid ${chrome.borderSubtle}`,
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
      <Text size="sm" c={chrome.textFaint}>
        No field changes recorded.
      </Text>
    )
  }

  return (
    <Stack gap={8}>
      {entries.map(([field, change]) => (
        <Box key={field} style={cardStyle}>
          <Text size="xs" fw={600} c={chrome.textMuted} mb={8}>
            {enumLabel(field)}
          </Text>
          <Group gap={8} wrap="nowrap" align="stretch">
            <ChangeValue label="Before" color={KIT.red} value={formatAuditValue(change.before)} />
            <Box style={{ display: 'flex', alignItems: 'center' }}>
              <IconArrowRight size={15} color={chrome.textFaint} />
            </Box>
            <ChangeValue label="After" color={KIT.green} value={formatAuditValue(change.after)} />
          </Group>
        </Box>
      ))}
    </Stack>
  )
}

function ChangeValue({ label, color, value }: { label: string; color: string; value: string }) {
  return (
    <Box style={valueStyle}>
      <Text size="xs" c={chrome.textFaint}>
        {label}
      </Text>
      <Text size="sm" c={color}>
        {value}
      </Text>
    </Box>
  )
}
