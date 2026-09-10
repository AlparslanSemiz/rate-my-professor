import { Badge, Box, SimpleGrid, Text, type CSSProperties } from '@mantine/core'
import { moduleGridCols } from '@/constants/layout'
import { formatDate } from '@/utils/formatDate'
import type { DashboardStats } from '../dashboardModel'
import { KIT } from '@/constants/colors'
import { chrome } from '@/theme'
import { EMPTY_VALUE } from '@/utils/emptyValue'

const heroStyle: CSSProperties = {
  // The only green-tinted surface in the panel: the dashboard's hero. The two stops are
  // local to it by design — naming them in `chrome` would imply they are reusable chrome.
  background: `linear-gradient(135deg, #0d1b12 0%, #111318 60%, ${chrome.surfaceSunken} 100%)`,
  border: `1px solid ${chrome.borderSubtle}`,
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
  border: `1px solid ${chrome.borderSubtle}`,
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
        : EMPTY_VALUE,
    },
  ]

  return (
    <Box mb={28} style={heroStyle}>
      <Box style={heroGlowStyle} />
      <Badge size="sm" variant="light" style={heroBadgeStyle}>
        Today at a glance
      </Badge>
      <Text fw={700} c={chrome.textBright} mb={6} style={heroTitleStyle}>
        Everything worth a look, all in one place.
      </Text>
      <Text size="sm" c={chrome.textDim} mb={24}>
        See who's around, what needs a second look, and how things are holding up, with no digging
        required.
      </Text>
      <SimpleGrid cols={moduleGridCols} spacing={16}>
        {metrics.map((metric) => (
          <Box key={metric.label} style={metricStyle}>
            <Text size="xs" c={chrome.textDim} mb={4}>
              {metric.label}
            </Text>
            <Text fw={600} c={chrome.textBright} size="sm">
              {metric.value}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}
