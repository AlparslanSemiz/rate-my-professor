import { Box, Button, Text, type CSSProperties } from '@mantine/core'
import { IconUsers } from '@tabler/icons-react'
import type { User } from '@/api/users'
import Panel from '@/components/Panel'
import TableHeaderRow from '@/components/TableHeaderRow'
import UsersTableHeader from './UsersTableHeader'
import UserTableRow from './UserTableRow'
import { chrome, iconSize } from '@/theme'
import { EMPTY_STATE_PADDING } from '@/constants/layout'

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
const emptyCellStyle: CSSProperties = { padding: EMPTY_STATE_PADDING, textAlign: 'center' }
const emptyIconStyle: CSSProperties = { marginBottom: 12 }
const loadMoreStyle: CSSProperties = { padding: '14px 20px', textAlign: 'center' }

interface UsersTableProps {
  users: User[]
  sortLabel: string
  /** Whether a further page exists. The cursor itself is the hook's business. */
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => Promise<void>
  onOpenProfile: (id: string) => void
}

export default function UsersTable({
  users,
  sortLabel,
  hasMore,
  loadingMore,
  onLoadMore,
  onOpenProfile,
}: UsersTableProps) {
  return (
    <Panel style={panelStyle}>
      <UsersTableHeader loadedCount={users.length} sortLabel={sortLabel} />

      <div style={tableScrollStyle}>
        <table style={tableStyle}>
          <TableHeaderRow columns={TABLE_COLUMNS} />
          <tbody>
            {users.length === 0 ? (
              <EmptyUsersRow />
            ) : (
              users.map((user, index) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  isLast={index === users.length - 1}
                  onOpenProfile={onOpenProfile}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <Box style={loadMoreStyle}>
          <Button variant="light" loading={loadingMore} onClick={() => void onLoadMore()}>
            Load more
          </Button>
        </Box>
      )}
    </Panel>
  )
}

function EmptyUsersRow() {
  return (
    <tr>
      <td colSpan={TABLE_COLUMNS.length} style={emptyCellStyle}>
        <IconUsers size={iconSize.emptyState} color={chrome.iconFaint} style={emptyIconStyle} />
        <Text c={chrome.textFaint} size="sm">
          No users found
        </Text>
      </td>
    </tr>
  )
}
