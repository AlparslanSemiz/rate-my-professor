import { Badge, Box, SimpleGrid, Text, type CSSProperties } from '@mantine/core'
import { moduleGridCols } from '../../../constants/layout'
import { formatDate } from '../../../utils/formatDate'
import type { DashboardStats } from '../hooks/useDashboardData'
import { KIT } from '../../../constants/colors'

const heroStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #0d1b12 0%, #111318 60%, #0f1117 100%)',
  border: '1px solid #1e2028',
  borderRadius: 14,
  padding: '28px 32px',
  position: 'relative',
  overflow: 'hidden',
}
const heroGlowStyle: CSSProperties = {
  position: 'absolute',
  top: -40,
  right: -40,
  width: 200,
  height: 200,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
}
const heroBadgeStyle: CSSProperties = {
  background: 'rgba(34,197,94,0.1)',
  color: KIT.green,
  borderColor: 'rgba(34,197,94,0.2)',
  marginBottom: 14,
  fontWeight: 600,
  letterSpacing: '0.02em',
  textTransform: 'none',
}
const heroTitleStyle: CSSProperties = { fontSize: 22, lineHeight: 1.2 }
const metricStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid #1e2028',
  borderRadius: 10,
  padding: '14px 16px',
}

interface DashboardHeroProps {
  stats: DashboardStats
  activeRate: number
  lastUpdated: Date | null
}

export default function DashboardHero({
  stats,
  activeRate,
  lastUpdated,
}: DashboardHeroProps) {
  const metrics = [
    // The same share System Pulse and the stat grid show. An INACTIVE account is neither
    // active nor blocked, so calling this "not blocked" made the dashboard disagree with
    // itself about its own number.
    { label: 'Active accounts', value: `${activeRate}%` },
    { label: 'Reports waiting', value: String(stats.openReports) },
    {
      label: 'Updated',
      // With seconds: the dashboard re-reads every 15 seconds, and a stamp that stops at
      // the minute makes a working refresh look stuck.
      value: lastUpdated
        ? formatDate(lastUpdated.toISOString(), { withTime: true, withSeconds: true })
        : '—',
    },
  ]

  return (
    <Box mb={28} style={heroStyle}>
      <Box style={heroGlowStyle} />
      <Badge size="sm" variant="light" style={heroBadgeStyle}>
        Today at a glance
      </Badge>
      <Text fw={700} c="#f1f5f9" mb={6} style={heroTitleStyle}>
        Everything worth a look, all in one place.
      </Text>
      <Text size="sm" c="#6b7280" mb={24}>
        See who's around, what needs a second look, and how things are holding up — no digging
        required.
      </Text>
      <SimpleGrid cols={moduleGridCols} spacing={16}>
        {metrics.map((metric) => (
          <Box key={metric.label} style={metricStyle}>
            <Text size="xs" c="#6b7280" mb={4}>
              {metric.label}
            </Text>
            <Text fw={600} c="#f1f5f9" size="sm">
              {metric.value}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}
