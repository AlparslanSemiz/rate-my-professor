import { Box, Button, Group, Text, type CSSProperties } from '@mantine/core'
import { IconFileSearch } from '@tabler/icons-react'
import type { AuditLog } from '@/api/logs'
import Panel from '@/components/Panel'
import TableHeaderRow from '@/components/TableHeaderRow'
import AuditLogRow from './AuditLogRow'
import { chrome } from '@/theme'

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
  borderTop: `1px solid ${chrome.border}`,
  padding: 16,
  textAlign: 'center',
}

interface AuditLogsTableProps {
  logs: AuditLog[]
  /** Whether a further page exists. The cursor itself is the hook's business. */
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  onOpen: (log: AuditLog) => void
  onLoadMore: () => Promise<void>
}

export default function AuditLogsTable({
  logs,
  hasMore,
  loading,
  loadingMore,
  onOpen,
  onLoadMore,
}: AuditLogsTableProps) {
  return (
    <Panel style={panelStyle} aria-busy={loading}>
      <Box px={20} py={14} style={{ borderBottom: `1px solid ${chrome.border}` }}>
        <Group gap={7}>
          <IconFileSearch size={15} color={chrome.textDim} />
          <Text size="xs" c={chrome.textDim}>
            {logs.length} audit event{logs.length === 1 ? '' : 's'} loaded · newest first
          </Text>
        </Group>
      </Box>

      {logs.length === 0 ? (
        <Box style={emptyStyle}>
          <IconFileSearch size={34} color={chrome.iconFaint} />
          <Text c={chrome.textDim} size="sm" mt={10}>
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
                  isLast={index === logs.length - 1 && !hasMore}
                  onOpen={onOpen}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

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
