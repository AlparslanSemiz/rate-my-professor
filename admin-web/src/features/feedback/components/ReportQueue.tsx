import { Badge, Box, Group, Text, type CSSProperties } from '@mantine/core'
import { IconBug } from '@tabler/icons-react'
import type { BugReport } from '../../../api/FeedbackService'
import Panel from '../../../components/Panel'
import { reportStatusColor, severityAccent, severityColor } from '../../../constants/colors'
import { activateOnEnterOrSpace } from '../../../utils/keyboard'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'

const panelStyle: CSSProperties = { overflow: 'hidden' }
const panelHeaderStyle: CSSProperties = { borderBottom: '1px solid #21262d' }
const emptyStateStyle: CSSProperties = { textAlign: 'center' }
const emptyIconStyle: CSSProperties = { marginBottom: 12 }
const severityBarStyle: CSSProperties = {
  width: 3,
  height: 36,
  borderRadius: 2,
  flexShrink: 0,
}

function reportRowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : '1px solid #1c2128',
    cursor: 'pointer',
    transition: 'background 0.1s',
  }
}

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
          <ReportItem
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

interface ReportItemProps {
  report: BugReport
  isLast: boolean
  onOpenReport: (id: string) => void
}

function ReportItem({ report, isLast, onOpenReport }: ReportItemProps) {
  const openReport = () => onOpenReport(report.id)

  return (
    <Box
      px={20}
      py={18}
      style={reportRowStyle(isLast)}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = '#1c2128'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'transparent'
      }}
      onClick={openReport}
      onKeyDown={(event) => activateOnEnterOrSpace(event, openReport)}
      role="button"
      aria-label={`Open bug report: ${report.title}`}
      tabIndex={0}
    >
      <Group justify="space-between" mb={8}>
        <Group gap={8}>
          <Box style={{ ...severityBarStyle, background: severityAccent[report.severity] }} />
          <div>
            <Text fw={600} c="#e2e8f0" size="sm">
              {report.title}
            </Text>
            <Group gap={6} mt={2}>
              <Badge color={severityColor[report.severity]} variant="light" size="xs">
                {enumLabel(report.severity)}
              </Badge>
              <Badge color={reportStatusColor[report.status]} variant="light" size="xs">
                {enumLabel(report.status)}
              </Badge>
            </Group>
          </div>
        </Group>
        <Text size="xs" c="#4b5563">
          {formatDate(report.reportedAt, { withTime: true })}
        </Text>
      </Group>
      <Text size="sm" c="#6b7280" ml={11}>
        {report.description}
      </Text>
      <Text size="xs" c="#374151" mt={6} ml={11}>
        Reported by {report.reporterName}
      </Text>
    </Box>
  )
}
