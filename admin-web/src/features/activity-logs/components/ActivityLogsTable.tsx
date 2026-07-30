import { Box, Button, Group, Text, type CSSProperties } from '@mantine/core'
import { IconActivity } from '@tabler/icons-react'
import type { ActivityLog } from '../../../api/ActivityLogsService'
import Panel from '../../../components/Panel'
import TableHeaderRow from '../../../components/TableHeaderRow'
import ActivityLogRow from './ActivityLogRow'

const TABLE_COLUMNS = ['Time', 'Who', 'Activity', 'Target', 'Detail'] as const
const panelStyle: CSSProperties = { overflow: 'hidden' }
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const tableStyle: CSSProperties = {
  width: '100%',
  minWidth: 960,
  borderCollapse: 'collapse',
}
const emptyStyle: CSSProperties = { padding: '56px 20px', textAlign: 'center' }
const loadMoreStyle: CSSProperties = {
  borderTop: '1px solid #21262d',
  padding: 16,
  textAlign: 'center',
}

interface ActivityLogsTableProps {
  activities: ActivityLog[]
  nextCursor: string | null
  loading: boolean
  loadingMore: boolean
  onOpen: (activity: ActivityLog) => void
  onLoadMore: () => Promise<void>
}

export default function ActivityLogsTable({
  activities,
  nextCursor,
  loading,
  loadingMore,
  onOpen,
  onLoadMore,
}: ActivityLogsTableProps) {
  return (
    <Panel style={panelStyle} aria-busy={loading}>
      <Box px={20} py={14} style={{ borderBottom: '1px solid #21262d' }}>
        <Group gap={7}>
          <IconActivity size={15} color="#6b7280" />
          <Text size="xs" c="#6b7280">
            {activities.length} event{activities.length === 1 ? '' : 's'} loaded · newest first
          </Text>
        </Group>
      </Box>

      {activities.length === 0 ? (
        <Box style={emptyStyle}>
          <IconActivity size={34} color="#374151" />
          <Text c="#6b7280" size="sm" mt={10}>
            No activity matches these filters.
          </Text>
        </Box>
      ) : (
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <TableHeaderRow columns={TABLE_COLUMNS} />
            <tbody>
              {activities.map((activity, index) => (
                <ActivityLogRow
                  key={activity.id}
                  activity={activity}
                  isLast={index === activities.length - 1 && !nextCursor}
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
