import { useEffect, useState, type CSSProperties } from 'react'
import { Text, Box, SimpleGrid, Group, Badge, Progress } from '@mantine/core'
import {
  IconUsers,
  IconUserCheck,
  IconShieldCheck,
  IconBug,
  IconRefresh,
} from '@tabler/icons-react'
import { usersService, type User } from '../api/UsersService'
import { feedbackService } from '../api/FeedbackService'
import { useNavigate } from 'react-router-dom'
import { StatCardDetailed } from '../components/StatCard'
import ModuleCard from '../components/ModuleCard'
import Panel from '../components/Panel'
import { roleColor } from '../constants/colors'
import { formatDate } from '../utils/formatDate'
import { enumLabel } from '../utils/enumLabel'
import { moduleGridCols, statGridCols, twoColumnGridCols } from '../constants/layout'

interface DashboardStats {
  total: number
  active: number
  admins: number
  openReports: number
}

const MODULES = [
  {
    label: 'Users',
    title: 'User operations',
    description: 'View profiles, manage sessions and roles across all registered accounts.',
    accent: '#3b82f6',
    path: '/users',
  },
  {
    label: 'Bug reports',
    title: 'Crash & feedback tracking',
    description: 'Review user-submitted bug forms and error crash logs.',
    accent: '#f97316',
    path: '/feedback',
  },
  {
    label: 'Comments',
    title: 'Reported content',
    description: 'Review user-flagged comments and take moderation actions.',
    accent: '#8b5cf6',
    path: '/comments',
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
  letterSpacing: '0.06em',
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

function countOpenReports(reports: { status: string }[]) {
  return reports.filter((report) => report.status === 'OPEN').length
}

function calculateDashboardStats(users: User[], openReports: number): DashboardStats {
  return {
    total: users.length,
    active: users.filter((user) => user.status === 'ACTIVE').length,
    admins: users.filter((user) => user.role === 'ADMIN').length,
    openReports,
  }
}

function activeRate({ total, active }: DashboardStats) {
  return total ? Math.round((active / total) * 100) : 0
}

function useDashboardData() {
  const [users, setUsers] = useState<User[]>([])
  const [openReports, setOpenReports] = useState(0)

  useEffect(() => {
    // The dashboard is an overview; if a request fails we keep the zeros
    // rather than blocking the whole page.
    usersService.getAll().then(setUsers).catch(() => {})
    feedbackService
      .getReports()
      .then((reports) => setOpenReports(countOpenReports(reports)))
      .catch(() => {})
  }, [])

  return { users, stats: calculateDashboardStats(users, openReports) }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { users, stats } = useDashboardData()
  const activePercentage = activeRate(stats)

  return (
    <div>
      <DashboardHeader />

      <OverviewHero activeRate={activePercentage} />

      <DashboardStatGrid stats={stats} />

      <SimpleGrid cols={twoColumnGridCols} spacing={16} mb={28}>
        <SystemPulse activeRate={activePercentage} />
        <RecentRegistrations users={users} onViewAll={() => navigate('/users')} />
      </SimpleGrid>

      <ModuleNavigation onNavigate={navigate} />
    </div>
  )
}

function DashboardHeader() {
  return (
    <>
      <Group gap={6} mb={24}>
        <IconRefresh size={14} color="#4b5563" />
        <Text size="xs" c="#4b5563">
          Operation center
        </Text>
      </Group>

      <Text fw={700} c="#f1f5f9" mb={4} style={pageTitleStyle}>
        Dashboard
      </Text>
      <Text size="sm" c="#6b7280" mb={32}>
        Live user activity, moderation queue and system health at a glance.
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

function OverviewHero({ activeRate }: { activeRate: number }) {
  const metrics = [
    { label: 'Active users rate', value: `${activeRate}%` },
    { label: 'Approval rate', value: '100%' },
    { label: 'Last refresh', value: formatDate(new Date().toISOString(), { withTime: true }) },
  ]

  return (
    <Box mb={28} style={heroStyle}>
      <Box style={heroGlowStyle} />
      <Badge
        size="sm"
        variant="light"
        style={heroBadgeStyle}
      >
        TODAY'S OPERATION OVERVIEW
      </Badge>
      <Text fw={700} c="#f1f5f9" mb={6} style={heroTitleStyle}>
        Users, moderation and system health — one panel.
      </Text>
      <Text size="sm" c="#6b7280" mb={24}>
        Quickly review active sessions, pending reports and maintenance signals in one place.
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

function SystemPulse({ activeRate }: { activeRate: number }) {
  const metrics = [
    { label: 'Active user rate', value: activeRate, color: '#3b82f6' },
    { label: 'Profile health', value: 100, color: '#22c55e' },
    { label: 'Pending moderation load', value: 0, color: '#f97316' },
  ]

  return (
    <Panel style={panelPaddingStyle}>
      <Text fw={600} c="#e2e8f0" mb={4} size="sm">
        System pulse
      </Text>
      <Text size="xs" c="#6b7280" mb={20}>
        Quick read on live metrics.
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
          Recent registrations
        </Text>
        <Text size="xs" c="#22c55e" style={viewAllStyle} onClick={onViewAll}>
          View all →
        </Text>
      </Group>
      <Text size="xs" c="#6b7280" mb={16}>
        Latest joined accounts.
      </Text>
      {users.length === 0 ? (
        <Box py={18} style={emptyRegistrationsStyle}>
          <Text size="sm" c="#4b5563">
            No registrations loaded yet.
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
        Modules
      </Text>
      <Text size="xs" c="#6b7280" mb={16}>
        Quick navigation to all admin sections.
      </Text>
      <SimpleGrid cols={moduleGridCols} spacing={16}>
        {MODULES.map((module) => (
          <ModuleCard key={module.path} {...module} onClick={onNavigate} />
        ))}
      </SimpleGrid>
    </Box>
  )
}
