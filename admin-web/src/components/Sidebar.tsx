import { Stack, Text, Box, UnstyledButton, Divider } from '@mantine/core'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import {
  IconLayoutDashboard,
  IconUsers,
  IconBug,
  IconMessageReport,
  IconShield,
  IconCircleFilled,
} from '@tabler/icons-react'

const navItems = [
  {
    label: 'Dashboard',
    sublabel: 'Operation overview',
    path: '/dashboard',
    icon: IconLayoutDashboard,
  },
  {
    label: 'Users',
    sublabel: 'Profiles & sessions',
    path: '/users',
    icon: IconUsers,
  },
  {
    label: 'Bug Reports',
    sublabel: 'Errors & crash tracking',
    path: '/feedback',
    icon: IconBug,
  },
  {
    label: 'Comments',
    sublabel: 'Reported content',
    path: '/comments',
    icon: IconMessageReport,
  },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Stack h="100%" gap={0} style={{ justifyContent: 'space-between' }}>
      {/* Header */}
      <div>
        <Box px={20} py={20} style={{ borderBottom: '1px solid #1e2028' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconShield size={18} color="white" />
            </Box>
            <div>
              <Text fw={600} size="sm" c="#f1f5f9" lh={1.2}>
                Admin Panel
              </Text>
              <Text size="xs" c="#4b5563" lh={1.2}>
                Operation center
              </Text>
            </div>
          </div>
        </Box>

        {/* Navigation */}
        <Stack gap={2} p={12}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <UnstyledButton
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: isActive ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
                  borderLeft: isActive ? '2px solid #22c55e' : '2px solid transparent',
                  transition: 'background 0.15s ease',
                  cursor: 'pointer',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <Box
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    size={16}
                    color={isActive ? '#22c55e' : '#6b7280'}
                  />
                </Box>
                <div>
                  <Text
                    size="sm"
                    fw={isActive ? 600 : 400}
                    c={isActive ? '#f1f5f9' : '#9ca3af'}
                    lh={1.2}
                  >
                    {item.label}
                  </Text>
                  <Text size="xs" c="#4b5563" lh={1.3}>
                    {item.sublabel}
                  </Text>
                </div>
              </UnstyledButton>
            )
          })}
        </Stack>
      </div>

      {/* Footer */}
      <div>
        <Divider color="#1e2028" />
        <Box px={16} py={14}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Box style={{ paddingTop: 3 }}>
              <IconCircleFilled size={8} color="#22c55e" />
            </Box>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" fw={500} c="#d1fae5" lh={1.3}>
                Admin session active
              </Text>
              <Text size="xs" c="#4b5563" lh={1.3} truncate>
                {user?.name ?? 'Admin'}
              </Text>
              <Text size="xs" c="#374151" lh={1.3} mt={4} truncate>
                {user?.email}
              </Text>
              <UnstyledButton
                onClick={handleLogout}
                mt={10}
                style={{
                  fontSize: 11,
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(239,68,68,0.25)',
                  background: 'rgba(239,68,68,0.06)',
                  lineHeight: 1,
                  display: 'inline-block',
                }}
              >
                Sign out
              </UnstyledButton>
            </div>
          </div>
        </Box>
      </div>
    </Stack>
  )
}
