import { useMemo } from 'react'
import { Badge, Box, Group, Text, UnstyledButton, type CSSProperties } from '@mantine/core'
import type { User } from '../../../api/UsersService'
import Panel from '../../../components/Panel'
import { roleColor } from '../../../constants/colors'
import { enumLabel } from '../../../utils/enumLabel'

const panelStyle: CSSProperties = { padding: '20px 24px' }
const RECENT_COUNT = 4

/**
 * `/users` promises no ordering, so "newest" has to be established here rather than assumed
 * from the position of a row in the response. An unparseable date sorts last instead of
 * poisoning the comparison with NaN.
 */
function joinedAt(user: User): number {
  const time = new Date(user.joined).getTime()
  return Number.isNaN(time) ? 0 : time
}

function newestFirst(users: User[]): User[] {
  return [...users].sort((left, right) => joinedAt(right) - joinedAt(left)).slice(0, RECENT_COUNT)
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

export default function RecentRegistrations({
  users,
  onViewAll,
}: {
  users: User[]
  onViewAll: () => void
}) {
  const newest = useMemo(() => newestFirst(users), [users])

  return (
    <Panel style={panelStyle}>
      <Group justify="space-between" mb={4}>
        <Text fw={600} c="#e2e8f0" size="sm">
          Newest members
        </Text>
        <UnstyledButton style={{ cursor: 'pointer' }} onClick={onViewAll}>
          <Text size="xs" c="#22c55e">
            See everyone →
          </Text>
        </UnstyledButton>
      </Group>
      <Text size="xs" c="#6b7280" mb={16}>
        The latest folks to join.
      </Text>
      {users.length === 0 ? (
        <Box py={18} style={{ textAlign: 'center' }}>
          <Text size="sm" c="#4b5563">
            No new members just yet.
          </Text>
        </Box>
      ) : (
        newest.map((user) => (
          <Box key={user.id} mb={12} style={rowStyle}>
            <div style={{ minWidth: 0 }}>
              <Text size="sm" fw={500} c="#d1d5db" truncate>
                {user.username}
              </Text>
              <Text size="xs" c="#4b5563" truncate>
                {user.kitEmail}
              </Text>
            </div>
            <Badge size="xs" variant="light" color={roleColor[user.role]}>
              {enumLabel(user.role)}
            </Badge>
          </Box>
        ))
      )}
    </Panel>
  )
}
