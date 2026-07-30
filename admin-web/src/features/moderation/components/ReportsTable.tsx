import { Box, Group, Text, type CSSProperties } from '@mantine/core'
import { IconMessageReport } from '@tabler/icons-react'
import Panel from '../../../components/Panel'
import TableHeaderRow from '../../../components/TableHeaderRow'
import type { ReportStatus } from '../../../domain/moderation'
import type { ReportItem } from '../moderationModel'
import ReportRow from './ReportRow'

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
const panelHeaderStyle: CSSProperties = { borderBottom: '1px solid #21262d' }
const emptyStateStyle: CSSProperties = { textAlign: 'center' }
const tableScrollStyle: CSSProperties = { overflowX: 'auto' }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', minWidth: 960 }

interface ReportsTableProps {
  reports: ReportItem[]
  updating: boolean
  onOpenProfile: (userId: string) => void
  onStatusChange: (report: ReportItem, status: ReportStatus) => void
  onWithdraw: (report: ReportItem) => void
}

export default function ReportsTable({
  reports,
  updating,
  onOpenProfile,
  onStatusChange,
  onWithdraw,
}: ReportsTableProps) {
  return (
    <Panel style={panelStyle}>
      <Box px={20} py={14} style={panelHeaderStyle}>
        <Group gap={6}>
          <IconMessageReport size={14} color="#6b7280" />
          <Text size="xs" c="#6b7280">
            {reports.length} report{reports.length !== 1 ? 's' : ''} matching filters
          </Text>
        </Group>
      </Box>

      {reports.length === 0 ? (
        <Box py={60} style={emptyStateStyle}>
          <IconMessageReport size={32} color="#374151" style={{ marginBottom: 12 }} />
          <Text c="#4b5563" size="sm">
            Nothing here — no reports match these filters.
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
                  isLast={index === reports.length - 1}
                  updating={updating}
                  onOpenProfile={onOpenProfile}
                  onStatusChange={onStatusChange}
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
