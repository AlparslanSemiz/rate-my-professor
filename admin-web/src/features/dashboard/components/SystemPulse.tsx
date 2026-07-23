import { Box, Group, Progress, Text, type CSSProperties } from '@mantine/core'
import Panel from '../../../components/Panel'
import type { DashboardStats } from '../hooks/useDashboardData'

const panelStyle: CSSProperties = { padding: '20px 24px' }

export default function SystemPulse({
  stats,
  activeRate,
}: {
  stats: DashboardStats
  activeRate: number
}) {
  const adminShare = stats.total ? Math.round((stats.admins / stats.total) * 100) : 0
  const queueCleared = stats.openReports === 0 ? 100 : Math.max(0, 100 - stats.openReports * 10)
  const metrics = [
    { label: 'Members active', value: activeRate, color: '#3b82f6' },
    { label: 'Admin coverage', value: adminShare, color: '#22c55e' },
    { label: 'Queue cleared', value: queueCleared, color: '#f97316' },
  ]

  return (
    <Panel style={panelStyle}>
      <Text fw={600} c="#e2e8f0" mb={4} size="sm">
        How things are running
      </Text>
      <Text size="xs" c="#6b7280" mb={20}>
        A quick read on today's numbers.
      </Text>
      {metrics.map((metric) => (
        <Box key={metric.label} mb={14}>
          <Group justify="space-between" mb={4}>
            <Text size="xs" c="#9ca3af">{metric.label}</Text>
            <Text size="xs" fw={600} c={metric.color}>{metric.value}%</Text>
          </Group>
          <Progress value={metric.value} color={metric.color} size="sm" radius="xl" bg="#21262d" />
        </Box>
      ))}
    </Panel>
  )
}
