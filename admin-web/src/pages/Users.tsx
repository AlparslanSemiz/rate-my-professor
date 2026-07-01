import { useEffect, useState } from 'react'
import { Badge, TextInput, Group, Text, Loader, Center, Box, SimpleGrid } from '@mantine/core'
import {
  IconSearch,
  IconUsers,
  IconUserCheck,
  IconShieldCheck,
  IconShieldOff,
} from '@tabler/icons-react'
import { usersService, type User } from '../api/UsersService'
import UserProfileModal from '../components/UserProfileModal'
import StatCard from '../components/StatCard'
import { roleColor, userStatusColor } from '../constants/colors'
import { formatDate } from '../utils/formatDate'
import type { UserChange } from '../hooks/useUserProfile'

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    usersService.getAll().then((data) => {
      setUsers(data)
      setLoading(false)
    })
  }, [])

  function openProfile(id: number) {
    setSelectedUserId(id)
    setProfileOpen(true)
  }

  function handleUserChanged(id: number, change: UserChange) {
    if (change === 'deleted') {
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setProfileOpen(false)
    } else if (change === 'blocked') {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'Blocked' } : u)))
    } else if (change === 'unblocked') {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'Active' } : u)))
    } else if (change === 'warned') {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, warningCount: u.warningCount + 1 } : u)))
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading)
    return (
      <Center h={200}>
        <Loader color="green" />
      </Center>
    )

  const total = users.length
  const active = users.filter((u) => u.status === 'Active').length
  const blocked = users.filter((u) => u.status === 'Blocked').length
  const admins = users.filter((u) => u.role === 'Admin').length

  return (
    <>
      <Text fw={700} c="#f1f5f9" mb={4} style={{ fontSize: 28, lineHeight: 1.1 }}>
        Users
      </Text>
      <Text size="sm" c="#6b7280" mb={28}>
        Profile health, sessions and moderation status for all registered accounts.
      </Text>

      <SimpleGrid cols={4} spacing={14} mb={28}>
        <StatCard label="Total users" value={total} icon={IconUsers} accent="#3b82f6" />
        <StatCard label="Active" value={active} icon={IconUserCheck} accent="#22c55e" />
        <StatCard label="Admin accounts" value={admins} icon={IconShieldCheck} accent="#f59e0b" />
        <StatCard label="Blocked" value={blocked} icon={IconShieldOff} accent="#ef4444" />
      </SimpleGrid>

      <Box
        style={{
          background: '#161b22',
          border: '1px solid #21262d',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Box px={20} py={16} style={{ borderBottom: '1px solid #21262d' }}>
          <Group justify="space-between">
            <div>
              <Text fw={600} c="#e2e8f0" size="sm">All users</Text>
              <Text size="xs" c="#4b5563">
                {filtered.length} of {total} accounts · click a row to view profile
              </Text>
            </div>
            <TextInput
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              w={260}
              size="sm"
              leftSection={<IconSearch size={14} color="#6b7280" />}
              styles={{
                input: {
                  background: '#0f1117',
                  border: '1px solid #21262d',
                  color: '#e2e8f0',
                },
              }}
            />
          </Group>
        </Box>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #21262d' }}>
                {['Name', 'Email', 'Role', 'Status', 'Warnings', 'Reports', 'Last seen', 'Joined'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '11px 20px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <Text c="#4b5563" size="sm">No users found</Text>
                  </td>
                </tr>
              ) : (
                filtered.map((user, i) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #1c2128' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1c2128' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    onClick={() => openProfile(user.id)}
                  >
                    <td style={{ padding: '13px 20px' }}>
                      <Text size="sm" fw={500} c="#e2e8f0">{user.name}</Text>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <Text size="sm" c="#6b7280">{user.email}</Text>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <Badge color={roleColor[user.role]} variant="light" size="sm">
                        {user.role}
                      </Badge>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <Badge color={userStatusColor[user.status]} variant="dot" size="sm">
                        {user.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      {user.warningCount > 0 ? (
                        <Badge color="yellow" variant="light" size="sm">
                          {user.warningCount}
                        </Badge>
                      ) : (
                        <Text size="xs" c="#374151">—</Text>
                      )}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      {user.reportCount > 0 ? (
                        <Badge color="red" variant="light" size="sm">
                          {user.reportCount}
                        </Badge>
                      ) : (
                        <Text size="xs" c="#374151">—</Text>
                      )}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <Text size="xs" c="#6b7280" style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(user.lastSeenAt)}
                      </Text>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <Text size="xs" c="#6b7280" style={{ whiteSpace: 'nowrap' }}>
                        {user.joinedAt}
                      </Text>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Box>

      <UserProfileModal
        userId={selectedUserId}
        opened={profileOpen}
        onClose={() => setProfileOpen(false)}
        onUserChanged={handleUserChanged}
      />
    </>
  )
}
