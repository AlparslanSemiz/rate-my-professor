import { Group, Stack, Text } from '@mantine/core'
import type { AuditEntry } from '@/api/logs'
import { chrome } from '@/theme'
import { formatLogValue, logEnumLabel } from '../../logModel'
import DetailSection from '@/components/DetailSection'

interface MetadataListProps {
  metadata: AuditEntry['metadata']
  /**
   * What to show when the backend recorded nothing else. Absent on the audit log, where the
   * changes are the content and an empty block would be noise; present on the activity log,
   * where metadata *is* the content and its absence is worth saying out loud.
   */
  emptyText?: string
}

/**
 * Whatever else the backend recorded about the entry — a warning's reason, a sign-in's
 * method, a refusal's path. Free-form by design, so it is rendered as key and value rather
 * than interpreted.
 */
export default function MetadataList({ metadata, emptyText }: MetadataListProps) {
  const entries = Object.entries(metadata)
  if (entries.length === 0) {
    if (emptyText === undefined) return null
    return (
      <DetailSection label="Additional context">
        <Text size="sm" c={chrome.textFaint}>
          {emptyText}
        </Text>
      </DetailSection>
    )
  }

  return (
    <DetailSection label="Additional context">
      <Stack gap={6}>
        {entries.map(([key, value]) => (
          <Group key={key} justify="space-between" align="flex-start" wrap="nowrap">
            <Text size="xs" c={chrome.textDim}>
              {logEnumLabel(key)}
            </Text>
            <Text size="sm" c={chrome.textSecondary} ta="right">
              {formatLogValue(value)}
            </Text>
          </Group>
        ))}
      </Stack>
    </DetailSection>
  )
}
