import { Box, Text, type CSSProperties } from '@mantine/core'
import { IconBug } from '@tabler/icons-react'
import type { BugReport } from '../../../api/FeedbackService'
import Panel from '../../../components/Panel'
import ReportQueueItem from './ReportQueueItem'

const panelStyle: CSSProperties = { overflow: 'hidden' }
const panelHeaderStyle: CSSProperties = { borderBottom: '1px solid #21262d' }
const emptyStateStyle: CSSProperties = { textAlign: 'center' }
const emptyIconStyle: CSSProperties = { marginBottom: 12 }

interface ReportQueueProps {
  reports: BugReport[]
  onOpenReport: (id: string) => void
}

export default function ReportQueue({ reports, onOpenReport }: ReportQueueProps) {
  return (
    <Panel style={panelStyle}>
      <Box px={20} py={16} style={panelHeaderStyle}>
        <Text fw={600} c="#e2e8f0" size="sm">
          Report queue
        </Text>
        <Text size="xs" c="#4b5563">
          Newest first · tap a report for the full story.
        </Text>
      </Box>

      {reports.length === 0 ? (
        <EmptyReportQueue />
      ) : (
        reports.map((report, index) => (
          <ReportQueueItem
            key={report.id}
            report={report}
            isLast={index === reports.length - 1}
            onOpenReport={onOpenReport}
          />
        ))
      )}
    </Panel>
  )
}

function EmptyReportQueue() {
  return (
    <Box py={60} style={emptyStateStyle}>
      <IconBug size={32} color="#374151" style={emptyIconStyle} />
      <Text c="#4b5563" size="sm">
        All quiet — no bug reports yet.
      </Text>
    </Box>
  )
}
