import { Badge, Box, Group, Text, type CSSProperties } from '@mantine/core'
import type { BugReport } from '../../../api/FeedbackService'
import { reportStatusColor, severityAccent, severityColor } from '../../../constants/colors'
import { activateOnEnterOrSpace } from '../../../utils/keyboard'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'

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

interface ReportQueueItemProps {
  report: BugReport
  isLast: boolean
  onOpenReport: (id: string) => void
}

export default function ReportQueueItem({
  report,
  isLast,
  onOpenReport,
}: ReportQueueItemProps) {
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
