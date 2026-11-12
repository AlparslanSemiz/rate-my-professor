import { ActionIcon, Badge, Group, Text, Tooltip, type CSSProperties } from '@mantine/core'
import { IconPencil, IconTrash, IconTrashX } from '@tabler/icons-react'
import UserChip from '@/components/UserChip'
import { reportReasonColor } from '@/constants/colors'
import type { ReportStatus } from '@/domain/moderation'
import { enumLabel } from '@/utils/enumLabel'
import { formatDate } from '@/utils/formatDate'
import type { ModeratedItem, ReportItem } from '../model'
import ReportedContentPreview from './ReportedContentPreview'
import ReportStatusSelect from './ReportStatusSelect'
import { chrome, iconSize } from '@/theme'
import { tableCellPadding } from '@/constants/layout'

const contentCellStyle: CSSProperties = { padding: tableCellPadding, maxWidth: 340 }
const userCellStyle: CSSProperties = { padding: tableCellPadding, whiteSpace: 'nowrap' }
const cellStyle: CSSProperties = { padding: tableCellPadding }
const dateCellStyle: CSSProperties = { ...cellStyle, whiteSpace: 'nowrap' }

function rowStyle(isLast: boolean): CSSProperties {
  return { borderBottom: isLast ? 'none' : `1px solid ${chrome.borderSubtle}` }
}

interface ReportRowProps {
  report: ReportItem
  /** The content the report is about, or null when it is no longer in the list. */
  content: ModeratedItem | null
  isLast: boolean
  updating: boolean
  onOpenProfile: (userId: string) => void
  onStatusChange: (report: ReportItem, status: ReportStatus) => void
  onEditContent: (item: ModeratedItem) => void
  onDeleteContent: (item: ModeratedItem) => void
  onWithdraw: (report: ReportItem) => void
}

export default function ReportRow({
  report,
  content,
  isLast,
  updating,
  onOpenProfile,
  onStatusChange,
  onEditContent,
  onDeleteContent,
  onWithdraw,
}: ReportRowProps) {
  return (
    <tr
      className="row-interactive"
      style={rowStyle(isLast)}
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
        <Text size="xs" c={chrome.textDim}>
          {formatDate(report.date, { withTime: true })}
        </Text>
      </td>
      <td style={cellStyle}>
        <ReportStatusSelect report={report} updating={updating} onStatusChange={onStatusChange} />
      </td>
      <td style={cellStyle}>
        <Group gap={2} wrap="nowrap">
          {/* Acting on the reported content itself, without hunting for it in the other tab.
              Both are disabled when the content is not in the loaded list — deleted, most
              likely, in which case there is nothing left to moderate. */}
          <Tooltip label={`Edit or hide the reported ${report.kind}`} withArrow>
            <ActionIcon
              variant="subtle"
              color="blue"
              size="sm"
              disabled={updating || content === null}
              aria-label={`Edit the reported ${report.kind} by ${report.reportedUser.name}`}
              onClick={() => content && onEditContent(content)}
            >
              <IconPencil size={iconSize.rowAction} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={`Delete the reported ${report.kind}`} withArrow>
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              disabled={updating || content === null}
              aria-label={`Delete the reported ${report.kind} by ${report.reportedUser.name}`}
              onClick={() => content && onDeleteContent(content)}
            >
              <IconTrashX size={iconSize.rowAction} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Withdraw this report (the content is left as it is)" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              disabled={updating}
              aria-label={`Withdraw report by ${report.reporter.name}`}
              onClick={() => onWithdraw(report)}
            >
              <IconTrash size={iconSize.rowAction} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </td>
    </tr>
  )
}
