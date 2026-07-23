import {
  Badge,
  Box,
  Group,
  Text,
  TextInput,
  type CSSProperties,
  type MantineColor,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import type { User } from '../../../api/UsersService'
import Panel from '../../../components/Panel'
import TableHeaderRow from '../../../components/TableHeaderRow'
import { roleColor, userStatusColor } from '../../../constants/colors'
import { darkInputStyles } from '../../../constants/inputStyles'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { activateOnEnterOrSpace } from '../../../utils/keyboard'

const TABLE_COLUMNS = [
  'Name',
  'Email',
  'Role',
  'Status',
  'Warnings',
  'Reports',
  'Last seen',
  'Joined',
] as const

const panelStyle: CSSProperties = { overflow: 'hidden' }
const panelHeaderStyle: CSSProperties = { borderBottom: '1px solid #21262d' }
const searchInputStyle: CSSProperties = { flex: '1 1 240px', maxWidth: 320 }
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const emptyCellStyle: CSSProperties = { padding: '40px 20px', textAlign: 'center' }
const userCellStyle: CSSProperties = { padding: '13px 20px' }
const dateTextStyle: CSSProperties = { whiteSpace: 'nowrap' }

function rowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : '1px solid #1c2128',
    cursor: 'pointer',
    transition: 'background 0.1s',
  }
}

interface UsersTableProps {
  users: User[]
  filteredUsers: User[]
  search: string
  onSearchChange: (value: string) => void
  onOpenProfile: (id: string) => void
}

export default function UsersTable({
  users,
  filteredUsers,
  search,
  onSearchChange,
  onOpenProfile,
}: UsersTableProps) {
  return (
    <Panel style={panelStyle}>
      <Box px={20} py={16} style={panelHeaderStyle}>
        <Group justify="space-between">
          <div>
            <Text fw={600} c="#e2e8f0" size="sm">
              All users
            </Text>
            <Text size="xs" c="#4b5563">
              {filteredUsers.length} of {users.length} members · tap a row to open a profile
            </Text>
          </div>
          <TextInput
            placeholder="Search by name or email..."
            value={search}
            onChange={(event) => onSearchChange(event.currentTarget.value)}
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

interface UserRowProps {
  user: User
  isLast: boolean
  onOpenProfile: (id: string) => void
}

function UserRow({ user, isLast, onOpenProfile }: UserRowProps) {
  const openProfile = () => onOpenProfile(user.id)

  return (
    <tr
      style={rowStyle(isLast)}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = '#1c2128'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'transparent'
      }}
      onClick={openProfile}
      onKeyDown={(event) => activateOnEnterOrSpace(event, openProfile)}
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

function CountBadge({ value, color }: { value: number; color: MantineColor }) {
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
