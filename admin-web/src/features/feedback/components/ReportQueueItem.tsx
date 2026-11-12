import { Badge, Box, Group, Text, type CSSProperties } from '@mantine/core'
import type { BugReport } from '@/api/feedback'
import { reportStatusColor, severityAccent } from '@/constants/colors'
import { activateOnEnterOrSpace } from '@/utils/keyboard'
import { enumLabel } from '@/utils/enumLabel'
import { formatDate } from '@/utils/formatDate'
import { reportStatusIcon } from '../model'
import { chrome } from '@/theme'

/** Inside a badge, so a step below `iconSize.badge`. */
const STATUS_BADGE_ICON_SIZE = 11


const severityBarStyle: CSSProperties = {
  width: 3,
  height: 36,
  borderRadius: 2,
  flexShrink: 0,
}
const bodyIndentStyle: CSSProperties = { paddingLeft: 11 }

function reportRowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : `1px solid ${chrome.borderSubtle}` }
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
            <Text fw={600} c={chrome.textPrimary} size="sm">
              {report.title}
            </Text>
            <Group gap={8} mt={4}>
              <Badge
                color={reportStatusColor[report.status]}
                variant="filled"
                size="sm"
                leftSection={<StatusIcon size={STATUS_BADGE_ICON_SIZE} />}
              >
                {enumLabel(report.status)}
              </Badge>
              <Text size="xs" c={chrome.textDim}>
                {enumLabel(report.severity)} severity
              </Text>
            </Group>
          </div>
        </Group>
        <Text size="xs" c={chrome.textFaint} style={{ whiteSpace: 'nowrap' }}>
          {formatDate(report.reportedAt, { withTime: true })}
        </Text>
      </Group>
      <Text size="sm" c={chrome.textDim} style={bodyIndentStyle}>
        {report.description}
      </Text>
      <Text size="xs" c={chrome.iconFaint} mt={6} style={bodyIndentStyle}>
        Reported by {report.reporterName}
      </Text>
    </Box>
  )
}
