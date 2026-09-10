import { Box, Stack, type CSSProperties } from '@mantine/core'
import { useLocation, useNavigate } from 'react-router-dom'
import { routes } from '@/constants/routes'
import { useAuth } from '@/context/useAuth'
import SessionFooter from './SessionFooter'
import SidebarHeader from './SidebarHeader'
import { OVERSIGHT_NAV_ITEMS } from './sidebarItems'
import SidebarNavButton from './SidebarNavButton'
import SidebarNavigation from './SidebarNavigation'

const shellStyle: CSSProperties = { justifyContent: 'space-between' }

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  async function handleLogout() {
    await logout()
    navigate(routes.login)
  }

  return (
    <Stack h="100%" gap={0} style={shellStyle}>
      <div>
        <SidebarHeader />
        <SidebarNavigation activePath={location.pathname} onNavigate={navigate} />
      </div>
      <div>
        <Box component="nav" aria-label="Oversight navigation" p={12}>
          <Stack gap={2}>
            {OVERSIGHT_NAV_ITEMS.map((item) => (
              <SidebarNavButton
                key={item.path}
                item={item}
                active={location.pathname === item.path}
                onNavigate={navigate}
              />
            ))}
          </Stack>
        </Box>
        <SessionFooter user={user} onLogout={handleLogout} />
      </div>
    </Stack>
  )
}
