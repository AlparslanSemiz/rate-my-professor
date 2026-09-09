import { Group, Stack, Text } from '@mantine/core'
import type { AuditLog } from '@/api/logs'
import { chrome } from '@/theme'
import { enumLabel } from '@/utils/enumLabel'
import { formatAuditValue } from '../../auditLogModel'
import DetailSection from './DetailSection'

/**
 * Whatever else the backend recorded about the entry — a warning's reason, a sign-in's
 * method. Free-form by design, so it is rendered as key and value rather than interpreted.
 */
export default function MetadataList({ metadata }: { metadata: AuditLog['metadata'] }) {
  const entries = Object.entries(metadata)
  if (entries.length === 0) return null

  return (
    <DetailSection label="Additional context">
      <Stack gap={6}>
        {entries.map(([key, value]) => (
          <Group key={key} justify="space-between" align="flex-start" wrap="nowrap">
            <Text size="xs" c={chrome.textDim}>
              {enumLabel(key)}
            </Text>
            <Text size="sm" c={chrome.textSecondary} ta="right">
              {formatAuditValue(value)}
            </Text>
          </Group>
        ))}
      </Stack>
    </DetailSection>
  )
}
