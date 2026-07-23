import { Box, Button, Group, Text, type CSSProperties } from '@mantine/core'
import { IconFileSearch } from '@tabler/icons-react'
import type { AuditLog } from '../../../api/AuditLogsService'
import Panel from '../../../components/Panel'
import TableHeaderRow from '../../../components/TableHeaderRow'
import AuditLogRow from './AuditLogRow'

const TABLE_COLUMNS = ['Time', 'Admin', 'Action', 'Target', 'Changed fields'] as const
const panelStyle: CSSProperties = { overflow: 'hidden' }
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const tableStyle: CSSProperties = {
  width: '100%',
  minWidth: 900,
  borderCollapse: 'collapse',
}
const emptyStyle: CSSProperties = { padding: '56px 20px', textAlign: 'center' }
const loadMoreStyle: CSSProperties = {
  borderTop: '1px solid #21262d',
  padding: 16,
  textAlign: 'center',
}

interface AuditLogsTableProps {
  logs: AuditLog[]
  nextCursor: string | null
  loading: boolean
  loadingMore: boolean
  onOpen: (log: AuditLog) => void
  onLoadMore: () => Promise<void>
}

export default function AuditLogsTable({
  logs,
  nextCursor,
  loading,
  loadingMore,
  onOpen,
  onLoadMore,
}: AuditLogsTableProps) {
  return (
    <Panel style={panelStyle} aria-busy={loading}>
      <Box px={20} py={14} style={{ borderBottom: '1px solid #21262d' }}>
        <Group gap={7}>
          <IconFileSearch size={15} color="#6b7280" />
          <Text size="xs" c="#6b7280">
            {logs.length} audit event{logs.length === 1 ? '' : 's'} loaded · newest first
          </Text>
        </Group>
      </Box>

      {logs.length === 0 ? (
        <Box style={emptyStyle}>
          <IconFileSearch size={34} color="#374151" />
          <Text c="#6b7280" size="sm" mt={10}>
            No audit events match these filters.
          </Text>
        </Box>
      ) : (
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <TableHeaderRow columns={TABLE_COLUMNS} />
            <tbody>
              {logs.map((log, index) => (
                <AuditLogRow
                  key={log.id}
                  log={log}
                  isLast={index === logs.length - 1 && !nextCursor}
                  onOpen={onOpen}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nextCursor && (
        <Box style={loadMoreStyle}>
          <Button variant="light" loading={loadingMore} onClick={() => void onLoadMore()}>
            Load more
          </Button>
        </Box>
      )}
    </Panel>
  )
}
