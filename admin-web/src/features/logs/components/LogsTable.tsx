import { Box, Button, Group, Text, type CSSProperties } from '@mantine/core'
import { IconFileSearch } from '@tabler/icons-react'
import type { AuditEntry } from '@/api/logs'
import Panel from '@/components/Panel'
import TableHeaderRow from '@/components/TableHeaderRow'
import LogRow from './LogRow'
import type { LogScreen } from '../logScreen'
import { chrome, iconSize } from '@/theme'
import { EMPTY_STATE_PADDING } from '@/constants/layout'

const panelStyle: CSSProperties = { overflow: 'hidden' }
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const tableStyle: CSSProperties = {
  width: '100%',
  minWidth: 900,
  borderCollapse: 'collapse',
}
const emptyStyle: CSSProperties = { padding: EMPTY_STATE_PADDING, textAlign: 'center' }
const loadMoreStyle: CSSProperties = {
  borderTop: `1px solid ${chrome.border}`,
  padding: 16,
  textAlign: 'center',
}

interface LogsTableProps<TEntry extends AuditEntry> {
  screen: LogScreen<TEntry>
  entries: TEntry[]
  /** Whether a further page exists. The cursor itself is the hook's business. */
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
  onOpen: (entry: TEntry) => void
  onLoadMore: () => Promise<void>
}

export default function LogsTable<TEntry extends AuditEntry>({
  screen,
  entries,
  hasMore,
  loading,
  loadingMore,
  onOpen,
  onLoadMore,
}: LogsTableProps<TEntry>) {
  return (
    <Panel style={panelStyle} aria-busy={loading}>
      <Box px={20} py={14} style={{ borderBottom: `1px solid ${chrome.border}` }}>
        <Group gap={7}>
          <IconFileSearch size={iconSize.rowAction} color={chrome.textDim} />
          <Text size="xs" c={chrome.textDim}>
            {screen.countLabel(entries.length)}
          </Text>
        </Group>
      </Box>

      {entries.length === 0 ? (
        <Box style={emptyStyle}>
          <IconFileSearch size={iconSize.emptyState} color={chrome.iconFaint} />
          <Text c={chrome.textDim} size="sm" mt={10}>
            {screen.emptyMessage}
          </Text>
        </Box>
      ) : (
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <TableHeaderRow columns={screen.columns} />
            <tbody>
              {entries.map((entry, index) => (
                <LogRow
                  key={entry.id}
                  screen={screen}
                  entry={entry}
                  isLast={index === entries.length - 1 && !hasMore}
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
