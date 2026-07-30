import { Select } from '@mantine/core'
import { reportStatusColor } from '../../../constants/colors'
import { isReportStatus, type ReportStatus } from '../../../domain/moderation'
import { reportStatusSelectOptions, type ReportItem } from '../moderationModel'

function statusSelectStyles(status: ReportStatus) {
  return {
    input: {
      background: '#0f1117',
      border: '1px solid #21262d',
      color: `var(--mantine-color-${reportStatusColor[status]}-4)`,
      fontWeight: 600,
      fontSize: 11,
    },
  }
}

interface ReportStatusSelectProps {
  report: ReportItem
  updating: boolean
  onStatusChange: (report: ReportItem, status: ReportStatus) => void
}

export default function ReportStatusSelect({
  report,
  updating,
  onStatusChange,
}: ReportStatusSelectProps) {
  return (
    <Select
      size="xs"
      value={report.status}
      data={reportStatusSelectOptions}
      styles={statusSelectStyles(report.status)}
      aria-label={`Status for report by ${report.reportedUser.name}`}
      disabled={updating}
      onChange={(value) => {
        if (isReportStatus(value)) onStatusChange(report, value)
      }}
    />
  )
}
