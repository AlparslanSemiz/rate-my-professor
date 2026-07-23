import type { CSSProperties } from 'react'
import { Text, Box, SimpleGrid, Group, Badge, Progress, UnstyledButton } from '@mantine/core'
import {
  IconUsers,
  IconUserCheck,
  IconShieldCheck,
  IconBug,
} from '@tabler/icons-react'
import type { User } from '../api/UsersService'
import { useNavigate } from 'react-router-dom'
import { StatCardDetailed } from '../components/StatCard'
import ModuleCard from '../components/ModuleCard'
import Panel from '../components/Panel'
import { roleColor } from '../constants/colors'
import { formatDate } from '../utils/formatDate'
import { enumLabel } from '../utils/enumLabel'
import { moduleGridCols, statGridCols, twoColumnGridCols } from '../constants/layout'
import { routes } from '../constants/routes'
import { useDashboardData, type DashboardStats } from '../hooks/useDashboardData'

const MODULES = [
  {
    label: 'Users',
    title: 'People',
    description: "Peek at profiles, sort out roles and tidy up sessions for everyone who's signed up.",
    accent: '#3b82f6',
    path: routes.users,
  },
  {
    label: 'Bug reports',
    title: 'Bugs & crashes',
    description: "See what's breaking — bug reports and crash logs, straight from your users.",
    accent: '#f97316',
    path: routes.feedback,
  },
  {
    label: 'Comments',
    title: 'Flagged comments',
    description: 'Look over the comments folks flagged and decide what happens next.',
    accent: '#8b5cf6',
    path: routes.comments,
  },
]

const pageTitleStyle: CSSProperties = {
  fontSize: 32,
  lineHeight: 1.1,
}

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
  color: '#22c55e',
  borderColor: 'rgba(34,197,94,0.2)',
  marginBottom: 14,
  fontWeight: 600,
  letterSpacing: '0.02em',
  textTransform: 'none',
}

const heroTitleStyle: CSSProperties = {
  fontSize: 22,
  lineHeight: 1.2,
}

const heroMetricStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid #1e2028',
  borderRadius: 10,
  padding: '14px 16px',
}

const panelPaddingStyle: CSSProperties = {
  padding: '20px 24px',
}

const viewAllStyle: CSSProperties = {
  cursor: 'pointer',
}

const emptyRegistrationsStyle: CSSProperties = {
  textAlign: 'center',
}

const registrationRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

const registrationTextStyle: CSSProperties = {
  minWidth: 0,
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { users, stats, activeRate, lastUpdated } = useDashboardData()

  return (
    <div>
      <DashboardHeader />

      <OverviewHero stats={stats} activeRate={activeRate} lastUpdated={lastUpdated} />

      <DashboardStatGrid stats={stats} />

      <SimpleGrid cols={twoColumnGridCols} spacing={16} mb={28}>
        <SystemPulse stats={stats} activeRate={activeRate} />
        <RecentRegistrations users={users} onViewAll={() => navigate(routes.users)} />
      </SimpleGrid>

      <ModuleNavigation onNavigate={navigate} />
    </div>
  )
}

function DashboardHeader() {
  return (
    <>
      <Text fw={700} c="#f1f5f9" mb={4} style={pageTitleStyle}>
        Dashboard
      </Text>
      <Text size="sm" c="#6b7280" mb={32}>
        A quick look at how your community's doing today.
      </Text>
    </>
  )
}

function DashboardStatGrid({ stats }: { stats: DashboardStats }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={16} mb={28}>
      <StatCardDetailed label="Total users" value={stats.total} sub={`${stats.active} active`} icon={IconUsers} accent="#3b82f6" />
      <StatCardDetailed label="Active users" value={stats.active} sub="Currently active" icon={IconUserCheck} accent="#22c55e" />
      <StatCardDetailed label="Admin accounts" value={stats.admins} sub="Privileged accounts" icon={IconShieldCheck} accent="#f59e0b" />
      <StatCardDetailed label="Open reports" value={stats.openReports} sub="Bug reports open" icon={IconBug} accent="#f97316" />
    </SimpleGrid>
  )
}

function OverviewHero({ stats, activeRate, lastUpdated }: { stats: DashboardStats; activeRate: number; lastUpdated: Date | null }) {
  const metrics = [
    { label: 'Members active', value: `${activeRate}%` },
    { label: 'Reports waiting', value: String(stats.openReports) },
    {
      label: 'Updated',
      value: lastUpdated ? formatDate(lastUpdated.toISOString(), { withTime: true }) : '—',
    },
  ]

  return (
    <Box mb={28} style={heroStyle}>
      <Box style={heroGlowStyle} />
      <Badge
        size="sm"
        variant="light"
        style={heroBadgeStyle}
      >
        Today at a glance
      </Badge>
      <Text fw={700} c="#f1f5f9" mb={6} style={heroTitleStyle}>
        Everything worth a look, all in one place.
      </Text>
      <Text size="sm" c="#6b7280" mb={24}>
        See who's around, what needs a second look, and how things are holding up — no digging required.
      </Text>

      <SimpleGrid cols={moduleGridCols} spacing={16}>
        {metrics.map((m) => (
          <Box
            key={m.label}
            style={heroMetricStyle}
          >
            <Text size="xs" c="#6b7280" mb={4}>
              {m.label}
            </Text>
            <Text fw={600} c="#f1f5f9" size="sm">
              {m.value}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}

function SystemPulse({ stats, activeRate }: { stats: DashboardStats; activeRate: number }) {
  const adminShare = stats.total ? Math.round((stats.admins / stats.total) * 100) : 0
  const queueCleared = stats.openReports === 0 ? 100 : Math.max(0, 100 - stats.openReports * 10)
  const metrics = [
    { label: 'Members active', value: activeRate, color: '#3b82f6' },
    { label: 'Admin coverage', value: adminShare, color: '#22c55e' },
    { label: 'Queue cleared', value: queueCleared, color: '#f97316' },
  ]

  return (
    <Panel style={panelPaddingStyle}>
      <Text fw={600} c="#e2e8f0" mb={4} size="sm">
        How things are running
      </Text>
      <Text size="xs" c="#6b7280" mb={20}>
        A quick read on today's numbers.
      </Text>
      {metrics.map((item) => (
        <Box key={item.label} mb={14}>
          <Group justify="space-between" mb={4}>
            <Text size="xs" c="#9ca3af">
              {item.label}
            </Text>
            <Text size="xs" fw={600} c={item.color}>
              {item.value}%
            </Text>
          </Group>
          <Progress value={item.value} color={item.color} size="sm" radius="xl" bg="#21262d" />
        </Box>
      ))}
    </Panel>
  )
}

function RecentRegistrations({ users, onViewAll }: { users: User[]; onViewAll: () => void }) {
  return (
    <Panel style={panelPaddingStyle}>
      <Group justify="space-between" mb={4}>
        <Text fw={600} c="#e2e8f0" size="sm">
          Newest members
        </Text>
        <UnstyledButton style={viewAllStyle} onClick={onViewAll}>
          <Text size="xs" c="#22c55e">
            See everyone →
          </Text>
        </UnstyledButton>
      </Group>
      <Text size="xs" c="#6b7280" mb={16}>
        The latest folks to join.
      </Text>
      {users.length === 0 ? (
        <Box py={18} style={emptyRegistrationsStyle}>
          <Text size="sm" c="#4b5563">
            No new members just yet.
          </Text>
        </Box>
      ) : (
        users.slice(0, 4).map((u) => (
          <Box key={u.id} mb={12} style={registrationRowStyle}>
            <div style={registrationTextStyle}>
              <Text size="sm" fw={500} c="#d1d5db" truncate>
                {u.username}
              </Text>
              <Text size="xs" c="#4b5563" truncate>
                {u.kitEmail}
              </Text>
            </div>
            <Badge size="xs" variant="light" color={roleColor[u.role]}>
              {enumLabel(u.role)}
            </Badge>
          </Box>
        ))
      )}
    </Panel>
  )
}

function ModuleNavigation({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <Box mb={8}>
      <Text fw={600} c="#e2e8f0" mb={4} size="sm">
        Jump to
      </Text>
      <Text size="xs" c="#6b7280" mb={16}>
        Head straight to any section.
      </Text>
      <SimpleGrid cols={moduleGridCols} spacing={16}>
        {MODULES.map((module) => (
          <ModuleCard key={module.path} {...module} onClick={onNavigate} />
        ))}
      </SimpleGrid>
    </Box>
  )
}
