import { Badge, Box, Group, Text, type CSSProperties } from '@mantine/core'
import type { BugReport } from '../../../api/FeedbackService'
import { reportStatusColor, severityAccent } from '../../../constants/colors'
import { activateOnEnterOrSpace } from '../../../utils/keyboard'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { reportStatusIcon } from '../feedbackModel'

const severityBarStyle: CSSProperties = {
  width: 3,
  height: 36,
  borderRadius: 2,
  flexShrink: 0,
}
const bodyIndentStyle: CSSProperties = { paddingLeft: 11 }

function reportRowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : '1px solid #1c2128' }
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
  const StatusIcon = reportStatusIcon[report.status]

  return (
    <Box
      px={20}
      py={18}
      className="row-interactive row-clickable"
      style={reportRowStyle(isLast)}
      onClick={openReport}
      onKeyDown={(event) => activateOnEnterOrSpace(event, openReport)}
      role="button"
      aria-label={`Open bug report: ${report.title}`}
      tabIndex={0}
    >
      <Group justify="space-between" wrap="nowrap" mb={8} gap={12}>
        <Group gap={8} wrap="nowrap">
          {/* Severity, as a bar rather than a second badge — it is the quieter of the two
              facts, and two matching badges is what made the status hard to find. */}
          <Box
            style={{ ...severityBarStyle, background: severityAccent[report.severity] }}
            aria-hidden
          />
          <div>
            <Text fw={600} c="#e2e8f0" size="sm">
              {report.title}
            </Text>
            <Group gap={8} mt={4}>
              <Badge
                color={reportStatusColor[report.status]}
                variant="filled"
                size="sm"
                leftSection={<StatusIcon size={11} />}
              >
                {enumLabel(report.status)}
              </Badge>
              <Text size="xs" c="#6b7280">
                {enumLabel(report.severity)} severity
              </Text>
            </Group>
          </div>
        </Group>
        <Text size="xs" c="#4b5563" style={{ whiteSpace: 'nowrap' }}>
          {formatDate(report.reportedAt, { withTime: true })}
        </Text>
      </Group>
      <Text size="sm" c="#6b7280" style={bodyIndentStyle}>
        {report.description}
      </Text>
      <Text size="xs" c="#374151" mt={6} style={bodyIndentStyle}>
        Reported by {report.reporterName}
      </Text>
    </Box>
  )
}
