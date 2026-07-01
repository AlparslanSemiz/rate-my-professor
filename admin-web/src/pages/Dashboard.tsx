import { useEffect, useState } from 'react'
import { Text, Box, SimpleGrid, Group, Badge, Progress } from '@mantine/core'
import {
  IconUsers,
  IconUserCheck,
  IconShieldCheck,
  IconBug,
  IconRefresh,
  IconArrowRight,
} from '@tabler/icons-react'
import { usersService, type User } from '../api/UsersService'
import { useNavigate } from 'react-router-dom'
import StatCard from '../components/StatCard'

function ModuleCard({
  label,
  title,
  description,
  accent,
  path,
  onClick,
}: {
  label: string
  title: string
  description: string
  accent: string
  path: string
  onClick: (path: string) => void
}) {
  return (
    <Box
      onClick={() => onClick(path)}
      style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 12,
        padding: '18px 20px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${accent}55`
        e.currentTarget.style.background = '#1c2128'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#21262d'
        e.currentTarget.style.background = '#161b22'
      }}
    >
      <Badge
        size="xs"
        variant="light"
        style={{
          background: `${accent}18`,
          color: accent,
          borderColor: `${accent}30`,
          marginBottom: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </Badge>
      <Text fw={600} c="#e2e8f0" size="sm" mb={6}>
        {title}
      </Text>
      <Text size="xs" c="#6b7280" mb={14} lh={1.5}>
        {description}
      </Text>
      <Group gap={4} style={{ color: accent }}>
        <Text size="xs" fw={500} c={accent}>
          Open
        </Text>
        <IconArrowRight size={12} color={accent} />
      </Group>
    </Box>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    usersService.getAll().then(setUsers)
  }, [])

  const now = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const total = users.length
  const active = users.filter((u) => u.status === 'Active').length
  const admins = users.filter((u) => u.role === 'Admin').length

  const modules = [
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

  return (
    <div>
      {/* Breadcrumb */}
      <Group gap={6} mb={24}>
        <IconRefresh size={14} color="#4b5563" />
        <Text size="xs" c="#4b5563">
          Operation center
        </Text>
      </Group>

      {/* Page title */}
      <Text fw={700} c="#f1f5f9" mb={4} style={{ fontSize: 32, lineHeight: 1.1 }}>
        Dashboard
      </Text>
      <Text size="sm" c="#6b7280" mb={32}>
        Live user activity, moderation queue and system health at a glance.
      </Text>

      {/* Hero card */}
      <Box
        mb={28}
        style={{
          background: 'linear-gradient(135deg, #0d1b12 0%, #111318 60%, #0f1117 100%)',
          border: '1px solid #1e2028',
          borderRadius: 14,
          padding: '28px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
          }}
        />
        <Badge
          size="sm"
          variant="light"
          style={{
            background: 'rgba(34,197,94,0.1)',
            color: '#22c55e',
            borderColor: 'rgba(34,197,94,0.2)',
            marginBottom: 14,
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}
        >
          TODAY'S OPERATION OVERVIEW
        </Badge>
        <Text fw={700} c="#f1f5f9" mb={6} style={{ fontSize: 22, lineHeight: 1.2 }}>
          Users, moderation and system health — one panel.
        </Text>
        <Text size="sm" c="#6b7280" mb={24}>
          Quickly review active sessions, pending reports and maintenance signals in one place.
        </Text>

        <SimpleGrid cols={3} spacing={16}>
          {[
            { label: 'Active users rate', value: total ? `${Math.round((active / total) * 100)}%` : '0%' },
            { label: 'Approval rate', value: '100%' },
            { label: 'Last refresh', value: now },
          ].map((m) => (
            <Box
              key={m.label}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #1e2028',
                borderRadius: 10,
                padding: '14px 16px',
              }}
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

      {/* Stats row */}
      <SimpleGrid cols={4} spacing={16} mb={28}>
        <StatCard
          label="Total users"
          value={total}
          sub={`${active} active`}
          icon={IconUsers}
          accent="#3b82f6"
        />
        <StatCard
          label="Active users"
          value={active}
          sub="Currently active"
          icon={IconUserCheck}
          accent="#22c55e"
        />
        <StatCard
          label="Admin accounts"
          value={admins}
          sub="Privileged accounts"
          icon={IconShieldCheck}
          accent="#f59e0b"
        />
        <StatCard
          label="Open reports"
          value={0}
          sub="Bug reports open"
          icon={IconBug}
          accent="#f97316"
        />
      </SimpleGrid>

      {/* System pulse */}
      <SimpleGrid cols={2} spacing={16} mb={28}>
        <Box
          style={{
            background: '#161b22',
            border: '1px solid #21262d',
            borderRadius: 12,
            padding: '20px 24px',
          }}
        >
          <Text fw={600} c="#e2e8f0" mb={4} size="sm">
            System pulse
          </Text>
          <Text size="xs" c="#6b7280" mb={20}>
            Quick read on live metrics.
          </Text>
          {[
            { label: 'Active user rate', value: total ? Math.round((active / total) * 100) : 0, color: '#3b82f6' },
            { label: 'Profile health', value: 100, color: '#22c55e' },
            { label: 'Pending moderation load', value: 0, color: '#f97316' },
          ].map((item) => (
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
        </Box>

        {/* Recent users */}
        <Box
          style={{
            background: '#161b22',
            border: '1px solid #21262d',
            borderRadius: 12,
            padding: '20px 24px',
          }}
        >
          <Group justify="space-between" mb={4}>
            <Text fw={600} c="#e2e8f0" size="sm">
              Recent registrations
            </Text>
            <Text
              size="xs"
              c="#22c55e"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/users')}
            >
              View all →
            </Text>
          </Group>
          <Text size="xs" c="#6b7280" mb={16}>
            Latest joined accounts.
          </Text>
          {users.slice(0, 4).map((u) => (
            <Box
              key={u.id}
              mb={12}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <Text size="sm" fw={500} c="#d1d5db">
                  {u.name}
                </Text>
                <Text size="xs" c="#4b5563">
                  {u.email}
                </Text>
              </div>
              <Badge
                size="xs"
                variant="light"
                color={u.role === 'Admin' ? 'blue' : u.role === 'Professor' ? 'violet' : 'gray'}
              >
                {u.role}
              </Badge>
            </Box>
          ))}
        </Box>
      </SimpleGrid>

      {/* Module grid */}
      <Box mb={8}>
        <Text fw={600} c="#e2e8f0" mb={4} size="sm">
          Modules
        </Text>
        <Text size="xs" c="#6b7280" mb={16}>
          Quick navigation to all admin sections.
        </Text>
        <SimpleGrid cols={3} spacing={16}>
          {modules.map((m) => (
            <ModuleCard key={m.path} {...m} onClick={navigate} />
          ))}
        </SimpleGrid>
      </Box>
    </div>
  )
}
