import { Box, Group, Progress, Text, type CSSProperties } from '@mantine/core'
import Panel from '@/components/Panel'
import type { DashboardStats } from '../dashboardModel'
import { KIT } from '@/constants/colors'
import { chrome } from '@/theme'

const panelStyle: CSSProperties = { padding: '20px 24px' }

export default function SystemPulse({
  stats,
  activeRate,
}: {
  stats: DashboardStats
  activeRate: number
}) {
  const adminShare = stats.total ? Math.round((stats.admins / stats.total) * 100) : 0
  // Both figures are real ratios of counts the backend returned, not scores derived from one
  // of them. "Reports handled" used to sit here as well; it needed the total number of bug
  // reports, and /system/status counts only the open ones.
  const metrics = [
    { label: 'Active accounts', value: activeRate, color: KIT.blue },
    { label: 'Admin share of accounts', value: adminShare, color: KIT.green },
  ]

  return (
    <Panel style={panelStyle}>
      <Text fw={600} c={chrome.textPrimary} mb={4} size="sm">
        How things are running
      </Text>
      <Text size="xs" c={chrome.textDim} mb={20}>
        A quick read on today's numbers.
      </Text>
      {metrics.map((metric) => (
        <Box key={metric.label} mb={14}>
          <Group justify="space-between" mb={4}>
            <Text size="xs" c={chrome.textMuted}>{metric.label}</Text>
            <Text size="xs" fw={600} c={metric.color}>{metric.value}%</Text>
          </Group>
          <Progress value={metric.value} color={metric.color} size="sm" radius="xl" bg={chrome.border} aria-label={metric.label} />
        </Box>
      ))}
    </Panel>
  )
}
