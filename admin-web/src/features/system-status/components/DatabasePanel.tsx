import { Badge, Group, Stack, Text, type CSSProperties } from '@mantine/core'
import { IconDatabase } from '@tabler/icons-react'
import type { DatabaseStatus } from '../../../api/SystemStatusService'
import Panel from '../../../components/Panel'
import { dependencyColor } from '../systemStatusModel'

const panelStyle: CSSProperties = { padding: '20px 24px' }

export default function DatabasePanel({ database }: { database: DatabaseStatus }) {
  return (
    <Panel style={panelStyle}>
      <Group gap={8} mb={14}>
        <IconDatabase size={15} color="#6b7280" />
        <Text fw={600} size="sm" c="#e2e8f0">
          Database
        </Text>
        <Badge variant="light" color={dependencyColor[database.status]} size="sm">
          {database.status}
        </Badge>
      </Group>
      <Stack gap={10}>
        <Row
          label="Round-trip latency"
          value={database.latencyMs === null ? 'Not reported' : `${database.latencyMs} ms`}
        />
        <Row
          label="Pending migrations"
          value={
            database.pendingMigrations === null
              ? 'Not reported'
              : String(database.pendingMigrations)
          }
          warn={(database.pendingMigrations ?? 0) > 0}
        />
      </Stack>
    </Panel>
  )
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <Group justify="space-between" wrap="nowrap" gap={16}>
      <Text size="xs" c="#6b7280">
        {label}
      </Text>
      <Text size="sm" c={warn ? '#fbbf24' : '#d1d5db'} fw={warn ? 600 : 400}>
        {value}
      </Text>
    </Group>
  )
}
