import { useEffect, useState } from 'react'
import { Badge, TextInput, Group, Text, Loader, Center, SimpleGrid, Box } from '@mantine/core'
import {
  IconSearch,
  IconUsers,
  IconUserCheck,
  IconShieldCheck,
  IconShieldOff,
} from '@tabler/icons-react'
import { usersService, type User } from '../api/UsersService'
import UserProfileModal from '../components/UserProfileModal'
import LoadError from '../components/LoadError'
import StatCard from '../components/StatCard'
import Panel from '../components/Panel'
import PageHeader from '../components/PageHeader'
import TableHeaderRow from '../components/TableHeaderRow'
import { roleColor, userStatusColor } from '../constants/colors'
import { darkInputStyles } from '../constants/inputStyles'
import { formatDate } from '../utils/formatDate'
import { enumLabel } from '../utils/enumLabel'
import { useSearch } from '../hooks/useSearch'
import type { UserChange } from '../hooks/useUserProfile'
import { statGridCols } from '../constants/layout'

const TABLE_COLUMNS = ['Name', 'Email', 'Role', 'Status', 'Warnings', 'Reports', 'Last seen', 'Joined']

function matchesQuery(user: User, query: string) {
  return user.username.toLowerCase().includes(query) || user.kitEmail.toLowerCase().includes(query)
}

function countByStatus(users: User[], status: User['status']) {
  return users.filter((u) => u.status === status).length
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const { search, setSearch, filtered } = useSearch(users, matchesQuery)

  useEffect(() => {
    usersService
      .getAll()
      .then(setUsers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [reloadKey])

  function retry() {
    setLoading(true)
    setError('')
    setReloadKey((k) => k + 1)
  }

  function openProfile(id: string) {
    setSelectedUserId(id)
    setProfileOpen(true)
  }

  function handleUserChanged(id: string, change: UserChange) {
    if (change === 'deleted') {
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setProfileOpen(false)
    } else if (change === 'blocked') {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'BLOCKED' } : u)))
    } else if (change === 'unblocked') {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'ACTIVE' } : u)))
    } else if (change === 'warned') {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, warnings: u.warnings + 1 } : u)))
    }
  }

  if (loading)
    return (
      <Center h={200}>
        <Loader color="green" />
      </Center>
    )

  if (error) return <LoadError message={error} onRetry={retry} />

  return (
    <>
      <PageHeader
        title="Users"
        description="Profile health, sessions and moderation status for all registered accounts."
      />

      <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
        <StatCard label="Total users" value={users.length} icon={IconUsers} accent="#3b82f6" />
        <StatCard label="Active" value={countByStatus(users, 'ACTIVE')} icon={IconUserCheck} accent="#22c55e" />
        <StatCard label="Admin accounts" value={users.filter((u) => u.role === 'ADMIN').length} icon={IconShieldCheck} accent="#f59e0b" />
        <StatCard label="Blocked" value={countByStatus(users, 'BLOCKED')} icon={IconShieldOff} accent="#ef4444" />
      </SimpleGrid>

      <Panel style={{ overflow: 'hidden' }}>
        <Box px={20} py={16} style={{ borderBottom: '1px solid #21262d' }}>
          <Group justify="space-between">
            <div>
              <Text fw={600} c="#e2e8f0" size="sm">All users</Text>
              <Text size="xs" c="#4b5563">
                {filtered.length} of {users.length} accounts · click a row to view profile
              </Text>
            </div>
            <TextInput
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: '1 1 240px', maxWidth: 320 }}
              size="sm"
              aria-label="Search users"
              leftSection={<IconSearch size={14} color="#6b7280" />}
              styles={darkInputStyles}
            />
          </Group>
        </Box>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <TableHeaderRow columns={TABLE_COLUMNS} />
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_COLUMNS.length} style={{ padding: '40px 20px', textAlign: 'center' }}>
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openProfile(user.id)
                      }
                    }}
                    tabIndex={0}
                  >
                    <td style={{ padding: '13px 20px' }}>
                      <Text size="sm" fw={500} c="#e2e8f0">{user.username}</Text>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <Text size="sm" c="#6b7280">{user.kitEmail}</Text>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <Badge color={roleColor[user.role]} variant="light" size="sm">
                        {enumLabel(user.role)}
                      </Badge>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <Badge color={userStatusColor[user.status]} variant="dot" size="sm">
                        {enumLabel(user.status)}
                      </Badge>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      {user.warnings > 0 ? (
                        <Badge color="yellow" variant="light" size="sm">
                          {user.warnings}
                        </Badge>
                      ) : (
                        <Text size="xs" c="#374151">—</Text>
                      )}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      {user.reports > 0 ? (
                        <Badge color="red" variant="light" size="sm">
                          {user.reports}
                        </Badge>
                      ) : (
                        <Text size="xs" c="#374151">—</Text>
                      )}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <Text size="xs" c="#6b7280" style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(user.lastOnline)}
                      </Text>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <Text size="xs" c="#6b7280" style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(user.joined)}
                      </Text>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <UserProfileModal
        userId={selectedUserId}
        opened={profileOpen}
        onClose={() => setProfileOpen(false)}
        onUserChanged={handleUserChanged}
      />
    </>
  )
}
