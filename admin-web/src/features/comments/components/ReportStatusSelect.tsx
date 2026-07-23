import { Select } from '@mantine/core'
import type { CommentReportStatus, ReportedComment } from '../../../api/CommentsService'
import { reportStatusColor } from '../../../constants/colors'
import { isReportStatus } from '../../../domain/moderation'
import { statusSelectOptions } from '../commentFilters'

function statusSelectStyles(status: CommentReportStatus) {
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
  report: ReportedComment
  updating: boolean
  onStatusChange: (id: string, status: CommentReportStatus) => void
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
      data={statusSelectOptions}
      styles={statusSelectStyles(report.status)}
      aria-label={`Status for report by ${report.reportedUser.name}`}
      disabled={updating}
      onChange={(value) => {
        if (isReportStatus(value)) onStatusChange(report.id, value)
      }}
    />
  )
}
