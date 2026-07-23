import { Box, Stack, type CSSProperties } from '@mantine/core'
import { useLocation, useNavigate } from 'react-router-dom'
import { routes } from '../../constants/routes'
import { useAuth } from '../../context/useAuth'
import SessionFooter from './SessionFooter'
import SidebarHeader from './SidebarHeader'
import { AUDIT_NAV_ITEM } from './sidebarItems'
import SidebarNavigation, { SidebarNavButton } from './SidebarNavigation'

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
        <Box component="nav" aria-label="Account navigation" p={12}>
          <SidebarNavButton
            item={AUDIT_NAV_ITEM}
            active={location.pathname === AUDIT_NAV_ITEM.path}
            onNavigate={navigate}
          />
        </Box>
        <SessionFooter user={user} onLogout={handleLogout} />
      </div>
    </Stack>
  )
}
