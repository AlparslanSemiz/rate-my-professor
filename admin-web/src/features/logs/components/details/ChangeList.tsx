import { Box, Group, Stack, Text, type CSSProperties } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import type { AuditChange } from '@/api/logs'
import { formatLogValue, logEnumLabel } from '../../logModel'
import { chrome, iconSize } from '@/theme'
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

/**
 * What an edit changed, field by field.
 *
 * Only the audit log composes this in: `changes` is empty for everything that is not a field
 * edit, and the whole activity half is creations, sign-ins and refusals — a heading with
 * "nothing recorded" under it on every single row would be noise rather than information.
 */
export default function ChangeList({ changes }: { changes: Record<string, AuditChange> }) {
  const entries = Object.entries(changes)

  return (
    <div>
      <Text size="xs" fw={600} c={chrome.textDim} tt="uppercase" mb={8}>
        Changes
      </Text>
      {entries.length === 0 ? (
        <Text size="sm" c={chrome.textFaint}>
          No field changes recorded.
        </Text>
      ) : (
        <Stack gap={8}>
          {entries.map(([field, change]) => (
            <Box key={field} style={cardStyle}>
              <Text size="xs" fw={600} c={chrome.textMuted} mb={8}>
                {logEnumLabel(field)}
              </Text>
              <Group gap={8} wrap="nowrap" align="stretch">
                <ChangeValue label="Before" color={KIT.red} value={formatLogValue(change.before)} />
                <Box style={{ display: 'flex', alignItems: 'center' }}>
                  <IconArrowRight size={iconSize.rowAction} color={chrome.textFaint} />
                </Box>
                <ChangeValue label="After" color={KIT.green} value={formatLogValue(change.after)} />
              </Group>
            </Box>
          ))}
        </Stack>
      )}
    </div>
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
