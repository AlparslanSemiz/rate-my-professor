import { useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Badge, TextInput, Group, Text, SimpleGrid, Box } from '@mantine/core'
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
import PageLoader from '../components/PageLoader'
import StatCard from '../components/StatCard'
import Panel from '../components/Panel'
import PageHeader from '../components/PageHeader'
import TableHeaderRow from '../components/TableHeaderRow'
import { roleColor, userStatusColor } from '../constants/colors'
import { darkInputStyles } from '../constants/inputStyles'
import { formatDate } from '../utils/formatDate'
import { enumLabel } from '../utils/enumLabel'
import { getErrorMessage } from '../utils/getErrorMessage'
import { countByValue, updateById } from '../utils/collection'
import { useSearch } from '../hooks/useSearch'
import type { UserChange } from '../hooks/useUserProfile'
import { statGridCols } from '../constants/layout'

const TABLE_COLUMNS = ['Name', 'Email', 'Role', 'Status', 'Warnings', 'Reports', 'Last seen', 'Joined'] as const
const LOAD_ERROR_MESSAGE = 'Failed to load users'

const panelOverflowStyle: CSSProperties = {
  overflow: 'hidden',
}

const panelHeaderStyle: CSSProperties = {
  borderBottom: '1px solid #21262d',
}

const searchInputStyle: CSSProperties = {
  flex: '1 1 240px',
  maxWidth: 320,
}

const tableScrollStyle: CSSProperties = {
  overflowX: 'auto',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const emptyCellStyle: CSSProperties = {
  padding: '40px 20px',
  textAlign: 'center',
}

const userCellStyle: CSSProperties = {
  padding: '13px 20px',
}

const dateTextStyle: CSSProperties = {
  whiteSpace: 'nowrap',
}

function matchesQuery(user: User, query: string) {
  return user.username.toLowerCase().includes(query) || user.kitEmail.toLowerCase().includes(query)
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
      .catch((err: unknown) => setError(getErrorMessage(err, LOAD_ERROR_MESSAGE)))
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
    switch (change) {
      case 'deleted':
        setUsers((prev) => prev.filter((user) => user.id !== id))
        setProfileOpen(false)
        break
      case 'blocked':
        setUsers((prev) => updateById(prev, id, (user) => ({ ...user, status: 'BLOCKED' })))
        break
      case 'unblocked':
        setUsers((prev) => updateById(prev, id, (user) => ({ ...user, status: 'ACTIVE' })))
        break
      case 'warned':
        setUsers((prev) => updateById(prev, id, (user) => ({ ...user, warnings: user.warnings + 1 })))
        break
    }
  }

  if (loading) return <PageLoader />

  if (error) return <LoadError message={error} onRetry={retry} />

  return (
    <>
      <PageHeader
        title="Users"
        description="Profile health, sessions and moderation status for all registered accounts."
      />

      <UsersStats users={users} />

      <UsersTable
        users={users}
        filteredUsers={filtered}
        search={search}
        onSearchChange={setSearch}
        onOpenProfile={openProfile}
      />

      <UserProfileModal
        userId={selectedUserId}
        opened={profileOpen}
        onClose={() => setProfileOpen(false)}
        onUserChanged={handleUserChanged}
      />
    </>
  )
}

function UsersStats({ users }: { users: User[] }) {
  const adminCount = users.filter((user) => user.role === 'ADMIN').length

  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard label="Total users" value={users.length} icon={IconUsers} accent="#3b82f6" />
      <StatCard label="Active" value={countByValue(users, 'status', 'ACTIVE')} icon={IconUserCheck} accent="#22c55e" />
      <StatCard label="Admin accounts" value={adminCount} icon={IconShieldCheck} accent="#f59e0b" />
      <StatCard label="Blocked" value={countByValue(users, 'status', 'BLOCKED')} icon={IconShieldOff} accent="#ef4444" />
    </SimpleGrid>
  )
}

interface UsersTableProps {
  users: User[]
  filteredUsers: User[]
  search: string
  onSearchChange: (value: string) => void
  onOpenProfile: (id: string) => void
}

function UsersTable({ users, filteredUsers, search, onSearchChange, onOpenProfile }: UsersTableProps) {
  return (
    <Panel style={panelOverflowStyle}>
      <Box px={20} py={16} style={panelHeaderStyle}>
        <Group justify="space-between">
          <div>
            <Text fw={600} c="#e2e8f0" size="sm">
              All users
            </Text>
            <Text size="xs" c="#4b5563">
              {filteredUsers.length} of {users.length} accounts · click a row to view profile
            </Text>
          </div>
          <TextInput
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            style={searchInputStyle}
            size="sm"
            aria-label="Search users"
            leftSection={<IconSearch size={14} color="#6b7280" />}
            styles={darkInputStyles}
          />
        </Group>
      </Box>

      <div style={tableScrollStyle}>
        <table style={tableStyle}>
          <TableHeaderRow columns={TABLE_COLUMNS} />
          <tbody>
            {filteredUsers.length === 0 ? (
              <EmptyUsersRow />
            ) : (
              filteredUsers.map((user, index) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isLast={index === filteredUsers.length - 1}
                  onOpenProfile={onOpenProfile}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function EmptyUsersRow() {
  return (
    <tr>
      <td colSpan={TABLE_COLUMNS.length} style={emptyCellStyle}>
        <Text c="#4b5563" size="sm">
          No users found
        </Text>
      </td>
    </tr>
  )
}

function rowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : '1px solid #1c2128',
    cursor: 'pointer',
    transition: 'background 0.1s',
  }
}

function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, onOpen: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onOpen()
  }
}

function UserRow({ user, isLast, onOpenProfile }: { user: User; isLast: boolean; onOpenProfile: (id: string) => void }) {
  const openProfile = () => onOpenProfile(user.id)

  return (
    <tr
      style={rowStyle(isLast)}
      onMouseEnter={(event) => { event.currentTarget.style.background = '#1c2128' }}
      onMouseLeave={(event) => { event.currentTarget.style.background = 'transparent' }}
      onClick={openProfile}
      onKeyDown={(event) => handleRowKeyDown(event, openProfile)}
      tabIndex={0}
    >
      <td style={userCellStyle}>
        <Text size="sm" fw={500} c="#e2e8f0">
          {user.username}
        </Text>
      </td>
      <td style={userCellStyle}>
        <Text size="sm" c="#6b7280">
          {user.kitEmail}
        </Text>
      </td>
      <td style={userCellStyle}>
        <Badge color={roleColor[user.role]} variant="light" size="sm">
          {enumLabel(user.role)}
        </Badge>
      </td>
      <td style={userCellStyle}>
        <Badge color={userStatusColor[user.status]} variant="dot" size="sm">
          {enumLabel(user.status)}
        </Badge>
      </td>
      <td style={userCellStyle}>
        <CountBadge value={user.warnings} color="yellow" />
      </td>
      <td style={userCellStyle}>
        <CountBadge value={user.reports} color="red" />
      </td>
      <td style={userCellStyle}>
        <Text size="xs" c="#6b7280" style={dateTextStyle}>
          {formatDate(user.lastOnline)}
        </Text>
      </td>
      <td style={userCellStyle}>
        <Text size="xs" c="#6b7280" style={dateTextStyle}>
          {formatDate(user.joined)}
        </Text>
      </td>
    </tr>
  )
}

function CountBadge({ value, color }: { value: number; color: string }) {
  if (value <= 0) {
    return (
      <Text size="xs" c="#374151">
        —
      </Text>
    )
  }

  return (
    <Badge color={color} variant="light" size="sm">
      {value}
    </Badge>
  )
}
