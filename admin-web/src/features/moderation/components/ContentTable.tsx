import { Fragment, useState } from 'react'
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
  /**
   * True while the list is narrowed by a search or filter. Threads then start open, because
   * a match inside an answer is otherwise hidden behind a collapsed row and the operator is
   * left looking at a comment with no visible reason to be there.
   */
  autoExpand?: boolean
  onOpenProfile: (userId: string) => void
  onEdit: (item: ModeratedItem) => void
  onDelete: (item: ModeratedItem) => void
}

export default function ContentTable({
  items,
  noun,
  updating,
  autoExpand = false,
  onOpenProfile,
  onEdit,
  onDelete,
}: ContentTableProps) {
  // While auto-expanding, the set records the rows explicitly closed instead; the component
  // is remounted when that mode changes, so the two meanings never mix.
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
              {items.map((item, index) => {
                const replies = item.replies ?? []
                const isExpanded = autoExpand ? !expanded.has(item.id) : expanded.has(item.id)
                const isLastTopLevel = index === items.length - 1

                return (
                  <Fragment key={item.id}>
                    <ContentRow
                      item={item}
                      isLast={isLastTopLevel && !(isExpanded && replies.length > 0)}
                      updating={updating}
                      onOpenProfile={onOpenProfile}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      expanded={isExpanded}
                      onToggleExpand={replies.length > 0 ? () => toggleExpanded(item.id) : undefined}
                    />
                    {isExpanded &&
                      replies.map((reply, replyIndex) => (
                        <ContentRow
                          key={reply.id}
                          item={reply}
                          isLast={isLastTopLevel && replyIndex === replies.length - 1}
                          updating={updating}
                          onOpenProfile={onOpenProfile}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          isReply
                        />
                      ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
