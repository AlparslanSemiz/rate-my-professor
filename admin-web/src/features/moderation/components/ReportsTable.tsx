import { Box, Group, Text, type CSSProperties } from '@mantine/core'
import { IconMessageReport } from '@tabler/icons-react'
import Panel from '@/components/Panel'
import TableHeaderRow from '@/components/TableHeaderRow'
import type { ReportStatus } from '@/domain/moderation'
import type { ModeratedItem, ReportItem } from '../model'
import ReportRow from './ReportRow'
import { EMPTY_STATE_PADDING } from '@/constants/layout'
import { chrome, iconSize } from '@/theme'

const TABLE_COLUMNS = [
  'Content & Report',
  'Reported user',
  'Reported by',
  'Reason',
  'Date',
  'Status',
  '',
] as const

const panelStyle: CSSProperties = { overflow: 'hidden' }
const panelHeaderStyle: CSSProperties = { borderBottom: `1px solid ${chrome.border}` }
const emptyStateStyle: CSSProperties = { padding: EMPTY_STATE_PADDING, textAlign: 'center' }
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 960 }

interface ReportsTableProps {
  reports: ReportItem[]
  updating: boolean
  /** Resolves the content a report is about, so a row can act on it. */
  contentFor: (report: ReportItem) => ModeratedItem | null
  onOpenProfile: (userId: string) => void
  onStatusChange: (report: ReportItem, status: ReportStatus) => void
  onEditContent: (item: ModeratedItem) => void
  onDeleteContent: (item: ModeratedItem) => void
  onWithdraw: (report: ReportItem) => void
}

export default function ReportsTable({
  reports,
  updating,
  contentFor,
  onOpenProfile,
  onStatusChange,
  onEditContent,
  onDeleteContent,
  onWithdraw,
}: ReportsTableProps) {
  return (
    <Panel style={panelStyle}>
      <Box px={20} py={14} style={panelHeaderStyle}>
        <Group gap={6}>
          <IconMessageReport size={iconSize.inline} color={chrome.textDim} />
          <Text size="xs" c={chrome.textDim}>
            {reports.length} report{reports.length !== 1 ? 's' : ''} matching filters
          </Text>
        </Group>
      </Box>

      {reports.length === 0 ? (
        <Box style={emptyStateStyle}>
          <IconMessageReport size={iconSize.emptyState} color={chrome.iconFaint} style={{ marginBottom: 12 }} />
          <Text c={chrome.textFaint} size="sm">
            Nothing here. No reports match these filters.
          </Text>
        </Box>
      ) : (
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <TableHeaderRow columns={TABLE_COLUMNS} />
            <tbody>
              {reports.map((report, index) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  content={contentFor(report)}
                  isLast={index === reports.length - 1}
                  updating={updating}
                  onOpenProfile={onOpenProfile}
                  onStatusChange={onStatusChange}
                  onEditContent={onEditContent}
                  onDeleteContent={onDeleteContent}
                  onWithdraw={onWithdraw}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
