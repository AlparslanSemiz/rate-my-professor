import { Badge, Box, Select, Text, Tooltip, type CSSProperties } from '@mantine/core'
import type { CommentReportStatus, ReportedComment } from '../../../api/CommentsService'
import UserChip from '../../../components/UserChip'
import { reportReasonColor, reportStatusColor } from '../../../constants/colors'
import { isReportStatus } from '../../../domain/moderation'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import { statusSelectOptions } from '../commentFilters'

const commentCellStyle: CSSProperties = { padding: '16px 20px', maxWidth: 340 }
const userCellStyle: CSSProperties = { padding: '16px 20px', whiteSpace: 'nowrap' }
const cellStyle: CSSProperties = { padding: '16px 20px' }
const dateCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }
const reportTextBoxStyle: CSSProperties = {
  background: 'rgba(239,68,68,0.06)',
  border: '1px solid rgba(239,68,68,0.15)',
  borderRadius: 6,
  padding: '5px 8px',
}
const breakWordStyle: CSSProperties = { wordBreak: 'break-word' }

function rowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : '1px solid #1c2128' }
}

function commentTextStyle(hasTooltip: boolean): CSSProperties {
  return {
    ...breakWordStyle,
    cursor: hasTooltip ? 'help' : 'default',
  }
}

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
        <CommentPreview report={report} />
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
      </td>
    </tr>
  )
}

function CommentPreview({ report }: { report: ReportedComment }) {
  const hasTooltip = report.commentContent.length > 80

  return (
    <>
      <Tooltip label={report.commentContent} multiline w={340} withArrow disabled={!hasTooltip}>
        <Text
          size="sm"
          c="#d1d5db"
          lineClamp={2}
          mb={4}
          style={commentTextStyle(hasTooltip)}
        >
          "{report.commentContent}"
        </Text>
      </Tooltip>
      {report.reportText && (
        <Box style={reportTextBoxStyle}>
          <Text size="xs" c="#fca5a5" lineClamp={2} style={breakWordStyle}>
            Report: {report.reportText}
          </Text>
        </Box>
      )}
    </>
  )
}
