import { Box, Text, type CSSProperties } from '@mantine/core'
import { IconBug } from '@tabler/icons-react'
import type { BugReport } from '@/api/feedback'
import Panel from '@/components/Panel'
import ReportQueueItem from './ReportQueueItem'
import { EMPTY_STATE_PADDING } from '@/constants/layout'
import { chrome, iconSize } from '@/theme'

const panelStyle: CSSProperties = { overflow: 'hidden' }
const panelHeaderStyle: CSSProperties = { borderBottom: `1px solid ${chrome.border}` }
const emptyStateStyle: CSSProperties = { padding: EMPTY_STATE_PADDING, textAlign: 'center' }
const emptyIconStyle: CSSProperties = { marginBottom: 12 }

interface ReportQueueProps {
  reports: BugReport[]
  title: string
  subtitle: string
  emptyMessage: string
  onOpenReport: (id: string) => void
}

export default function ReportQueue({
  reports,
  title,
  subtitle,
  emptyMessage,
  onOpenReport,
}: ReportQueueProps) {
  return (
    <Panel style={panelStyle}>
      <Box px={20} py={16} style={panelHeaderStyle}>
        <Text fw={600} c={chrome.textPrimary} size="sm">
          {title}
        </Text>
        <Text size="xs" c={chrome.textFaint}>
          {subtitle}
        </Text>
      </Box>

      {reports.length === 0 ? (
        <EmptyReportQueue message={emptyMessage} />
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

function EmptyReportQueue({ message }: { message: string }) {
  return (
    <Box style={emptyStateStyle}>
      <IconBug size={iconSize.emptyState} color={chrome.iconFaint} style={emptyIconStyle} />
      <Text c={chrome.textFaint} size="sm">
        {message}
      </Text>
    </Box>
  )
}
