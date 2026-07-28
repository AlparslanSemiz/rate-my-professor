import { Group, Stack, Text, type CSSProperties } from '@mantine/core'
import { IconPencilCheck } from '@tabler/icons-react'
import Panel from '../../../components/Panel'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'

const panelStyle: CSSProperties = { padding: '20px 24px' }

/** When each administrative action last actually wrote to the database. */
export default function LastWriteList({
  lastWriteAt,
}: {
  lastWriteAt: Record<string, string | null>
}) {
  const entries = Object.entries(lastWriteAt)

  return (
    <Panel style={panelStyle}>
      <Group gap={8} mb={4}>
        <IconPencilCheck size={15} color="#6b7280" />
        <Text fw={600} size="sm" c="#e2e8f0">
          Last successful write
        </Text>
      </Group>
      <Text size="xs" c="#6b7280" mb={14}>
        Proof that each admin action reaches the database.
      </Text>

      {entries.length === 0 ? (
        <Text size="sm" c="#4b5563">
          The backend did not report any write timestamps.
        </Text>
      ) : (
        <Stack gap={10}>
          {entries.map(([action, timestamp]) => (
            <Group key={action} justify="space-between" wrap="nowrap" gap={16}>
              <Text size="xs" c="#9ca3af">
                {enumLabel(action)}
              </Text>
              <Text size="sm" c={timestamp ? '#d1d5db' : '#4b5563'} ta="right">
                {timestamp ? formatDate(timestamp, { withTime: true }) : 'Never'}
              </Text>
            </Group>
          ))}
        </Stack>
      )}
    </Panel>
  )
}
