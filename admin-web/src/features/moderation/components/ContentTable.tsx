import { Fragment } from 'react'
import { Box, Group, Text, type CSSProperties } from '@mantine/core'
import { useSet } from '@mantine/hooks'
import { IconMessage } from '@tabler/icons-react'
import Panel from '@/components/Panel'
import TableHeaderRow from '@/components/TableHeaderRow'
import type { ModeratedItem } from '../model'
import ContentRow from './ContentRow'
import { EMPTY_STATE_PADDING } from '@/constants/layout'
import { chrome, iconSize } from '@/theme'

const TABLE_COLUMNS = ['Content', 'Author', 'Lecture', 'Visibility', 'Reports', 'Posted', ''] as const

/**
 * Widths for the seven columns above, in order.
 *
 * The table is laid out `fixed` and these are why. Under the browser's automatic layout every
 * column is measured from its contents, so expanding a thread — which inserts indented answer
 * rows with different text in them — re-measured all seven and shifted the whole table
 * sideways under the operator's cursor. Fixed layout reads these widths once and never
 * re-measures, so opening and closing a thread moves nothing.
 */
const COLUMN_WIDTHS = ['28%', '14%', '15%', '9%', '7%', '17%', '10%'] as const

const panelStyle: CSSProperties = { overflow: 'hidden' }
const panelHeaderStyle: CSSProperties = { borderBottom: `1px solid ${chrome.border}` }
const emptyStateStyle: CSSProperties = { padding: EMPTY_STATE_PADDING, textAlign: 'center' }
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  // Raised with the fixed layout: percentage columns no longer borrow space from each other,
  // so every one of them has to hold its own contents at the narrowest the table can get.
  minWidth: 1100,
  tableLayout: 'fixed',
}

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
  const expanded = useSet<string>()

  function toggleExpanded(id: string) {
    if (expanded.has(id)) expanded.delete(id)
    else expanded.add(id)
  }

  return (
    <Panel style={panelStyle}>
      <Box px={20} py={14} style={panelHeaderStyle}>
        <Group gap={6}>
          <IconMessage size={iconSize.inline} color={chrome.textDim} />
          <Text size="xs" c={chrome.textDim}>
            {items.length} {noun}
            {items.length === 1 ? '' : 's'} matching filters · newest first
          </Text>
        </Group>
      </Box>

      {items.length === 0 ? (
        <Box style={emptyStateStyle}>
          <IconMessage size={iconSize.emptyState} color={chrome.iconFaint} style={{ marginBottom: 12 }} />
          <Text c={chrome.textFaint} size="sm">
            Nothing here. No {noun}s match these filters.
          </Text>
        </Box>
      ) : (
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <colgroup>
              {COLUMN_WIDTHS.map((width, index) => (
                <col key={index} style={{ width }} />
              ))}
            </colgroup>
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
