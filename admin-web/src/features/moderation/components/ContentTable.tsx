import { Box, Group, Text, type CSSProperties } from '@mantine/core'
import { IconMessage } from '@tabler/icons-react'
import Panel from '../../../components/Panel'
import TableHeaderRow from '../../../components/TableHeaderRow'
import type { ModeratedItem } from '../moderationModel'
import ContentRow from './ContentRow'

const TABLE_COLUMNS = ['Content', 'Author', 'Lecture', 'Visibility', 'Reports', 'Posted', ''] as const

const panelStyle: CSSProperties = { overflow: 'hidden' }
const panelHeaderStyle: CSSProperties = { borderBottom: '1px solid #21262d' }
const emptyStateStyle: CSSProperties = { textAlign: 'center' }
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 960 }

interface ContentTableProps {
  items: ModeratedItem[]
  noun: string
  updating: boolean
  onOpenProfile: (userId: string) => void
  onEdit: (item: ModeratedItem) => void
  onDelete: (item: ModeratedItem) => void
}

export default function ContentTable({
  items,
  noun,
  updating,
  onOpenProfile,
  onEdit,
  onDelete,
}: ContentTableProps) {
  return (
    <Panel style={panelStyle}>
      <Box px={20} py={14} style={panelHeaderStyle}>
        <Group gap={6}>
          <IconMessage size={14} color="#6b7280" />
          <Text size="xs" c="#6b7280">
            {items.length} {noun}
            {items.length === 1 ? '' : 's'} matching filters · newest first
          </Text>
        </Group>
      </Box>

      {items.length === 0 ? (
        <Box py={60} style={emptyStateStyle}>
          <IconMessage size={32} color="#374151" style={{ marginBottom: 12 }} />
          <Text c="#4b5563" size="sm">
            Nothing here — no {noun}s match these filters.
          </Text>
        </Box>
      ) : (
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <TableHeaderRow columns={TABLE_COLUMNS} />
            <tbody>
              {items.map((item, index) => (
                <ContentRow
                  key={item.id}
                  item={item}
                  isLast={index === items.length - 1}
                  updating={updating}
                  onOpenProfile={onOpenProfile}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
