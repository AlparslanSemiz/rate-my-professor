import { ActionIcon, Badge, Text, Tooltip, type CSSProperties } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import UserChip from '../../../components/UserChip'
import { reportReasonColor } from '../../../constants/colors'
import type { ReportStatus } from '../../../domain/moderation'
import { enumLabel } from '../../../utils/enumLabel'
import { formatDate } from '../../../utils/formatDate'
import type { ReportItem } from '../moderationModel'
import ReportedContentPreview from './ReportedContentPreview'
import ReportStatusSelect from './ReportStatusSelect'

const contentCellStyle: CSSProperties = { padding: '16px 20px', maxWidth: 340 }
const userCellStyle: CSSProperties = { padding: '16px 20px', whiteSpace: 'nowrap' }
const cellStyle: CSSProperties = { padding: '16px 20px' }
const dateCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }

function rowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : '1px solid #1c2128' }
}

interface ReportRowProps {
  report: ReportItem
  isLast: boolean
  updating: boolean
  onOpenProfile: (userId: string) => void
  onStatusChange: (report: ReportItem, status: ReportStatus) => void
  onWithdraw: (report: ReportItem) => void
}

export default function ReportRow({
  report,
  isLast,
  updating,
  onOpenProfile,
  onStatusChange,
  onWithdraw,
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
      <td style={contentCellStyle}>
        <ReportedContentPreview report={report} />
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
        <ReportStatusSelect report={report} updating={updating} onStatusChange={onStatusChange} />
      </td>
      <td style={cellStyle}>
        <Tooltip label="Withdraw this report — the content is left as it is" withArrow>
          <ActionIcon
            variant="subtle"
            color="red"
            size="sm"
            disabled={updating}
            aria-label={`Withdraw report by ${report.reporter.name}`}
            onClick={() => onWithdraw(report)}
          >
            <IconTrash size={15} />
          </ActionIcon>
        </Tooltip>
      </td>
    </tr>
  )
}
