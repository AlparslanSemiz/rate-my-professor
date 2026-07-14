import { Stack, Text, Box, UnstyledButton, Divider } from '@mantine/core'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import type { AuthUser } from '../context/AuthContextValue'
import type { CSSProperties } from 'react'
import {
  IconLayoutDashboard,
  IconUsers,
  IconBug,
  IconMessageReport,
  IconShield,
  IconCircleFilled,
} from '@tabler/icons-react'

const ACTIVE_COLOR = '#22c55e'
const BORDER_COLOR = '#1e2028'
const NAV_HOVER_BACKGROUND = 'rgba(255,255,255,0.04)'
const MUTED_TEXT = '#4b5563'

const navItems = [
  {
    label: 'Dashboard',
    sublabel: 'The big picture',
    path: '/dashboard',
    icon: IconLayoutDashboard,
  },
  {
    label: 'Users',
    sublabel: 'People & profiles',
    path: '/users',
    icon: IconUsers,
  },
  {
    label: 'Comments',
    sublabel: 'Flagged comments',
    path: '/comments',
    icon: IconMessageReport,
  },
  {
    label: 'Bug Reports',
    sublabel: 'Bugs & crashes',
    path: '/feedback',
    icon: IconBug,
  },
]

const shellStyle: CSSProperties = {
  justifyContent: 'space-between',
}

const brandRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const brandMarkStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  background: 'linear-gradient(135deg, #34d17a, #16a34a)',
  boxShadow: '0 4px 14px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const navButtonBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 10,
  transition: 'background 0.18s ease, box-shadow 0.18s ease',
  cursor: 'pointer',
  width: '100%',
}

const sessionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
}

const sessionInfoStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const logoutButtonStyle: CSSProperties = {
  fontSize: 11,
  color: '#ef4444',
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: 4,
  border: '1px solid rgba(239,68,68,0.25)',
  background: 'rgba(239,68,68,0.06)',
  lineHeight: 1,
  display: 'inline-block',
}

function navButtonStyle(isActive: boolean): CSSProperties {
  return {
    ...navButtonBaseStyle,
    background: isActive
      ? 'linear-gradient(180deg, rgba(34,197,94,0.14), rgba(34,197,94,0.06))'
      : 'transparent',
    border: isActive ? '1px solid rgba(34,197,94,0.22)' : '1px solid transparent',
    boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 14px rgba(34,197,94,0.10)' : 'none',
  }
}

function navIconStyle(isActive: boolean): CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: isActive ? 'rgba(34, 197, 94, 0.18)' : 'rgba(255,255,255,0.05)',
    boxShadow: isActive ? '0 0 0 1px rgba(34,197,94,0.22), 0 2px 10px rgba(34,197,94,0.18)' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.18s ease, box-shadow 0.18s ease',
  }
}

function setInactiveNavBackground(element: HTMLElement, isActive: boolean, background: string) {
  if (!isActive) {
    element.style.background = background
  }
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Stack h="100%" gap={0} style={shellStyle}>
      <div>
        <SidebarHeader />
        <SidebarNavigation activePath={location.pathname} onNavigate={navigate} />
      </div>

      <SessionFooter user={user} onLogout={handleLogout} />
    </Stack>
  )
}

function SidebarHeader() {
  return (
    <Box px={20} py={20} style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
      <div style={brandRowStyle}>
        <Box style={brandMarkStyle}>
          <IconShield size={18} color="white" />
        </Box>
        <div>
          <Text fw={600} size="sm" c="#f1f5f9" lh={1.2}>
            Admin Panel
          </Text>
          <Text size="xs" c={MUTED_TEXT} lh={1.2}>
            Admin toolkit
          </Text>
        </div>
      </div>
    </Box>
  )
}

function SidebarNavigation({ activePath, onNavigate }: { activePath: string; onNavigate: (path: string) => void }) {
  return (
    <Stack gap={2} p={12}>
      {navItems.map((item) => (
        <SidebarNavButton
          key={item.path}
          item={item}
          active={activePath === item.path}
          onNavigate={onNavigate}
        />
      ))}
    </Stack>
  )
}

function SidebarNavButton({
  item,
  active,
  onNavigate,
}: {
  item: (typeof navItems)[number]
  active: boolean
  onNavigate: (path: string) => void
}) {
  const Icon = item.icon

  return (
    <UnstyledButton
      onClick={() => onNavigate(item.path)}
      aria-current={active ? 'page' : undefined}
      style={navButtonStyle(active)}
      onMouseEnter={(event) => setInactiveNavBackground(event.currentTarget, active, NAV_HOVER_BACKGROUND)}
      onMouseLeave={(event) => setInactiveNavBackground(event.currentTarget, active, 'transparent')}
    >
      <Box style={navIconStyle(active)}>
        <Icon size={16} color={active ? ACTIVE_COLOR : '#6b7280'} />
      </Box>
      <div>
        <Text size="sm" fw={active ? 600 : 400} c={active ? '#f1f5f9' : '#9ca3af'} lh={1.2}>
          {item.label}
        </Text>
        <Text size="xs" c={MUTED_TEXT} lh={1.3}>
          {item.sublabel}
        </Text>
      </div>
    </UnstyledButton>
  )
}

function SessionFooter({ user, onLogout }: { user: AuthUser | null; onLogout: () => void }) {
  return (
    <div>
      <Divider color={BORDER_COLOR} />
      <Box px={16} py={14}>
        <div style={sessionRowStyle}>
          <Box style={{ paddingTop: 3 }}>
            <IconCircleFilled size={8} color={ACTIVE_COLOR} />
          </Box>
          <div style={sessionInfoStyle}>
            <Text size="xs" fw={500} c="#d1fae5" lh={1.3}>
              You're signed in
            </Text>
            <Text size="xs" c={MUTED_TEXT} lh={1.3} truncate>
              {user?.name ?? 'Admin'}
            </Text>
            <Text size="xs" c="#374151" lh={1.3} mt={4} truncate>
              {user?.email}
            </Text>
            <UnstyledButton onClick={onLogout} mt={10} style={logoutButtonStyle}>
              Sign out
            </UnstyledButton>
          </div>
        </div>
      </Box>
    </div>
  )
}
