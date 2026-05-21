import { NavLink, Stack, Title, Text, Button, Divider } from '@mantine/core'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Users', path: '/users' },
  { label: 'Feedback', path: '/feedback' },
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
    <Stack p="md" gap="xs" h="100%" style={{ justifyContent: 'space-between' }}>
      <div>
        <Title order={4} mb="md">Admin Panel</Title>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            active={location.pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>

      <div>
        <Divider mb="sm" />
        <Text size="sm" c="dimmed" mb="xs">{user?.name}</Text>
        <Text size="xs" c="dimmed" mb="sm">{user?.email}</Text>
        <Button variant="subtle" color="red" fullWidth size="xs" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>
    </Stack>
  )
}
