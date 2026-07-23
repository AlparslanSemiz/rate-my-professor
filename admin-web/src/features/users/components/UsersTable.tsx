import { Text, type CSSProperties } from '@mantine/core'
import type { User } from '../../../api/UsersService'
import Panel from '../../../components/Panel'
import TableHeaderRow from '../../../components/TableHeaderRow'
import UsersTableHeader from './UsersTableHeader'
import UserTableRow from './UserTableRow'

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
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const emptyCellStyle: CSSProperties = { padding: '40px 20px', textAlign: 'center' }

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
      <UsersTableHeader
        filteredCount={filteredUsers.length}
        totalCount={users.length}
        search={search}
        onSearchChange={onSearchChange}
      />

      <div style={tableScrollStyle}>
        <table style={tableStyle}>
          <TableHeaderRow columns={TABLE_COLUMNS} />
          <tbody>
            {filteredUsers.length === 0 ? (
              <EmptyUsersRow />
            ) : (
              filteredUsers.map((user, index) => (
                <UserTableRow
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
