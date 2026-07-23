import { Badge, Text, type CSSProperties } from '@mantine/core'
import type { CommentReportStatus, ReportedComment } from '../../../api/CommentsService'
import UserChip from '../../../components/UserChip'
import { reportReasonColor } from '../../../constants/colors'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import ReportedCommentPreview from './ReportedCommentPreview'
import ReportStatusSelect from './ReportStatusSelect'

const commentCellStyle: CSSProperties = { padding: '16px 20px', maxWidth: 340 }
const userCellStyle: CSSProperties = { padding: '16px 20px', whiteSpace: 'nowrap' }
const cellStyle: CSSProperties = { padding: '16px 20px' }
const dateCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }

function rowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : '1px solid #1c2128' }
}

interface ReportRowProps {
  report: ReportedComment
  isLast: boolean
  updating: boolean
  onOpenProfile: (userId: string) => void
  onStatusChange: (id: string, status: CommentReportStatus) => void
}

export default function ReportRow({
  report,
  isLast,
  updating,
  onOpenProfile,
  onStatusChange,
}: ReportRowProps) {
  return (
    <tr
      style={rowStyle(isLast)}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = '#1c2128'
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'transparent'
      }}
    >
      <td style={commentCellStyle}>
        <ReportedCommentPreview report={report} />
      </td>
      <td style={userCellStyle}>
        <UserChip
          id={report.reportedUser.id}
          name={report.reportedUser.name}
          role={report.reportedUser.role}
          warningCount={report.reportedUser.warnings}
          status={report.reportedUser.status}
          onClick={onOpenProfile}
        />
      </td>
      <td style={userCellStyle}>
        <UserChip
          id={report.reporter.id}
          name={report.reporter.name}
          role={report.reporter.role}
          warningCount={report.reporter.warnings}
          status={report.reporter.status}
          onClick={onOpenProfile}
        />
      </td>
      <td style={cellStyle}>
        <Badge color={reportReasonColor[report.reason]} variant="light" size="sm">
          {enumLabel(report.reason)}
        </Badge>
      </td>
      <td style={dateCellStyle}>
        <Text size="xs" c="#6b7280">
          {formatDate(report.date, { withTime: true })}
        </Text>
      </td>
      <td style={cellStyle}>
        <ReportStatusSelect
          report={report}
          updating={updating}
          onStatusChange={onStatusChange}
        />
      </td>
    </tr>
  )
}
