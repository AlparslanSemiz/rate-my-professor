import { Group, Stack, Text, type CSSProperties } from '@mantine/core'
import { IconPencilCheck } from '@tabler/icons-react'
import type { LastWrite } from '../../../api/SystemStatusService'
import Panel from '../../../components/Panel'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { formatAge } from '../systemStatusModel'

const panelStyle: CSSProperties = { padding: '20px 24px' }

/**
 * The newest audit event. This is the proof that an action taken in the panel reached the
 * database: perform one, refresh, and it should be at the top here.
 */
export default function LastWritePanel({ lastWrite }: { lastWrite: LastWrite | null }) {
  return (
    <Panel style={panelStyle}>
      <Group gap={8} mb={4}>
        <IconPencilCheck size={15} color="#6b7280" />
        <Text fw={600} size="sm" c="#e2e8f0">
          Last successful write
        </Text>
      </Group>
      <Text size="xs" c="#6b7280" mb={14}>
        Proof that an action taken here reaches the database.
      </Text>

      {lastWrite === null ? (
        <Text size="sm" c="#4b5563">
          Nothing has been recorded yet.
        </Text>
      ) : (
        <Stack gap={10}>
          <Row label="Action" value={enumLabel(lastWrite.action)} />
          <Row label="By" value={lastWrite.actorName} />
          <Row label="At" value={formatDate(lastWrite.at, { withTime: true })} />
          <Row label="Age" value={formatAge(lastWrite.ageSeconds)} />
        </Stack>
      )}
    </Panel>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap={16}>
      <Text size="xs" c="#9ca3af">
        {label}
      </Text>
      <Text size="sm" c="#d1d5db" ta="right" style={{ wordBreak: 'break-word' }}>
        {value}
      </Text>
    </Group>
  )
}
