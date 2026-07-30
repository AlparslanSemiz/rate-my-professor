import { Badge, Box, Button, Group, Stack, Text, type CSSProperties } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import type { SystemStatus } from '../../../api/SystemStatusService'
import Panel from '../../../components/Panel'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { formatUptime, healthAccent, healthColor, healthDescription } from '../systemStatusModel'

const panelStyle: CSSProperties = { padding: '20px 24px', marginBottom: 16 }

function dotStyle(accent: string): CSSProperties {
  return {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: accent,
    boxShadow: `0 0 12px ${accent}`,
    flexShrink: 0,
  }
}

interface SystemHealthBannerProps {
  status: SystemStatus
  refreshing: boolean
  onRefresh: () => void
}

export default function SystemHealthBanner({
  status,
  refreshing,
  onRefresh,
}: SystemHealthBannerProps) {
  return (
    <Panel style={panelStyle}>
      <Group justify="space-between" align="flex-start" wrap="wrap" gap={16}>
        <Stack gap={6}>
          <Group gap={10}>
            <Box style={dotStyle(healthAccent[status.status])} aria-hidden />
            {/* The API answered, or this page could not render at all — the status describes
                the database behind it. */}
            <Text fw={700} c="#f1f5f9" style={{ fontSize: 20, lineHeight: 1.1 }}>
              API is up, database is {enumLabel(status.status).toLowerCase()}
            </Text>
            <Badge variant="light" color={healthColor[status.status]} size="sm">
              {status.status}
            </Badge>
          </Group>
          <Text size="sm" c="#8a93a1">
            {healthDescription[status.status]}
          </Text>
          <Group gap={16} mt={4}>
            <Meta label="Checked" value={formatDate(status.checkedAt, { withTime: true })} />
            <Meta
              label="Started"
              value={status.startedAt ? formatDate(status.startedAt, { withTime: true }) : 'Unknown'}
            />
            <Meta label="Uptime" value={formatUptime(status.uptimeSeconds)} />
          </Group>
        </Stack>
        <Button
          variant="light"
          color="green"
          leftSection={<IconRefresh size={15} />}
          loading={refreshing}
          onClick={onRefresh}
        >
          Refresh now
        </Button>
      </Group>
    </Panel>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="xs" c="#4b5563" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }}>
        {label}
      </Text>
      <Text size="sm" c="#cbd5e1">
        {value}
      </Text>
    </div>
  )
}
