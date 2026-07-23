import { Box, Divider, Text, UnstyledButton, type CSSProperties } from '@mantine/core'
import { IconCircleFilled } from '@tabler/icons-react'
import type { AuthUser } from '../../context/AuthContextValue'

const ACTIVE_COLOR = '#22c55e'
const BORDER_COLOR = '#1e2028'
const sessionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
}
const sessionInfoStyle: CSSProperties = { flex: 1, minWidth: 0 }
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

export default function SessionFooter({
  user,
  onLogout,
}: {
  user: AuthUser | null
  onLogout: () => Promise<void>
}) {
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
            <Text size="xs" c="#4b5563" lh={1.3} truncate>
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
