import { useEffect, useState, useMemo, type CSSProperties } from 'react'
import {
  Badge,
  Text,
  Select,
  TextInput,
  Group,
  Tooltip,
  Box,
  SimpleGrid,
} from '@mantine/core'
import {
  IconSearch,
  IconMessageReport,
  IconClock,
  IconEye,
  IconX,
  IconCheck,
} from '@tabler/icons-react'
import {
  commentsService,
  type ReportedComment,
  type CommentReportStatus,
  type ReportReason,
} from '../api/CommentsService'
import UserProfileModal from '../components/UserProfileModal'
import LoadError from '../components/LoadError'
import PageLoader from '../components/PageLoader'
import StatCard from '../components/StatCard'
import UserChip from '../components/UserChip'
import Panel from '../components/Panel'
import PageHeader from '../components/PageHeader'
import TableHeaderRow from '../components/TableHeaderRow'
import { reportStatusColor, reportReasonColor } from '../constants/colors'
import { darkInputStyles } from '../constants/inputStyles'
import { formatDate } from '../utils/formatDate'
import { enumLabel } from '../utils/enumLabel'
import { getErrorMessage } from '../utils/getErrorMessage'
import { countByValue, updateById } from '../utils/collection'
import { useSearch } from '../hooks/useSearch'
import { statGridCols } from '../constants/layout'

const ALL = 'All'
const STATUS_OPTIONS: CommentReportStatus[] = ['OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN']
const REASON_OPTIONS: ReportReason[] = [
  'SPAM',
  'INSULT',
  'HARASSMENT',
  'HATE_SPEECH',
  'PERSONAL_INFORMATION',
  'OFF_TOPIC',
  'INAPPROPRIATE_CONTENT',
  'OTHER',
]
const TABLE_COLUMNS = ['Comment & Report', 'Reported user', 'Reported by', 'Reason', 'Date', 'Status'] as const
const LOAD_ERROR_MESSAGE = 'Failed to load reported comments'

type StatusFilter = typeof ALL | CommentReportStatus
type ReasonFilter = typeof ALL | ReportReason

const statusSelectOptions = STATUS_OPTIONS.map((status) => ({ value: status, label: enumLabel(status) }))
const reasonSelectOptions = REASON_OPTIONS.map((reason) => ({ value: reason, label: enumLabel(reason) }))
const statusFilterOptions = [{ value: ALL, label: ALL }, ...statusSelectOptions]
const reasonFilterOptions = [{ value: ALL, label: ALL }, ...reasonSelectOptions]

const filtersPanelStyle: CSSProperties = {
  padding: '14px 20px',
}

const searchInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 200,
}

const panelOverflowStyle: CSSProperties = {
  overflow: 'hidden',
}

const panelHeaderStyle: CSSProperties = {
  borderBottom: '1px solid #21262d',
}

const emptyStateStyle: CSSProperties = {
  textAlign: 'center',
}

const emptyIconStyle: CSSProperties = {
  marginBottom: 12,
}

const tableScrollStyle: CSSProperties = {
  overflowX: 'auto',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 900,
}

const commentCellStyle: CSSProperties = {
  padding: '16px 20px',
  maxWidth: 340,
}

const userCellStyle: CSSProperties = {
  padding: '16px 20px',
  whiteSpace: 'nowrap',
}

const cellStyle: CSSProperties = {
  padding: '16px 20px',
}

const dateCellStyle: CSSProperties = {
  ...cellStyle,
  whiteSpace: 'nowrap',
}

const reportTextBoxStyle: CSSProperties = {
  background: 'rgba(239,68,68,0.06)',
  border: '1px solid rgba(239,68,68,0.15)',
  borderRadius: 6,
  padding: '5px 8px',
}

const breakWordStyle: CSSProperties = {
  wordBreak: 'break-word',
}

function commentTextStyle(hasTooltip: boolean): CSSProperties {
  return {
    ...breakWordStyle,
    cursor: hasTooltip ? 'help' : 'default',
  }
}

function rowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : '1px solid #1c2128',
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

function matchesQuery(report: ReportedComment, query: string) {
  return (
    report.commentContent.toLowerCase().includes(query) ||
    report.reportedUser.name.toLowerCase().includes(query) ||
    report.reporter.name.toLowerCase().includes(query) ||
    report.reportText.toLowerCase().includes(query)
  )
}

function matchesFilters(report: ReportedComment, status: StatusFilter, reason: ReasonFilter) {
  return (status === ALL || report.status === status) && (reason === ALL || report.reason === reason)
}

export default function CommentsPage() {
  const [reports, setReports] = useState<ReportedComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [filterStatus, setFilterStatus] = useState<StatusFilter>(ALL)
  const [filterReason, setFilterReason] = useState<ReasonFilter>(ALL)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const { search, setSearch, filtered: searchFiltered } = useSearch(reports, matchesQuery)

  const filtered = useMemo(
    () => searchFiltered.filter((report) => matchesFilters(report, filterStatus, filterReason)),
    [searchFiltered, filterStatus, filterReason]
  )

  useEffect(() => {
    commentsService
      .getReported()
      .then(setReports)
      .catch((err: unknown) => setError(getErrorMessage(err, LOAD_ERROR_MESSAGE)))
      .finally(() => setLoading(false))
  }, [reloadKey])

  function retry() {
    setLoading(true)
    setError('')
    setReloadKey((k) => k + 1)
  }

  async function handleStatusChange(id: string, status: CommentReportStatus) {
    await commentsService.updateStatus(id, status)
    setReports((prev) => updateById(prev, id, (report) => ({ ...report, status })))
  }

  function openProfile(userId: string) {
    setProfileUserId(userId)
    setProfileOpen(true)
  }

  if (loading) return <PageLoader />

  if (error) return <LoadError message={error} onRetry={retry} />

  return (
    <>
      <PageHeader
        title="Reported Comments"
        description="Comments your community flagged, waiting for a look. Tap a name to open their profile."
      />

      <CommentsStats reports={reports} />

      <CommentFilters
        search={search}
        status={filterStatus}
        reason={filterReason}
        onSearchChange={setSearch}
        onStatusChange={setFilterStatus}
        onReasonChange={setFilterReason}
      />

      <CommentsTable
        reports={filtered}
        onOpenProfile={openProfile}
        onStatusChange={handleStatusChange}
      />

      <UserProfileModal
        userId={profileUserId}
        opened={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  )
}

function CommentsStats({ reports }: { reports: ReportedComment[] }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard label="Open" value={countByValue(reports, 'status', 'OPEN')} icon={IconClock} accent="#f97316" />
      <StatCard label="Reviewed" value={countByValue(reports, 'status', 'REVIEWED')} icon={IconEye} accent="#3b82f6" />
      <StatCard label="Dismissed" value={countByValue(reports, 'status', 'DISMISSED')} icon={IconX} accent="#6b7280" />
      <StatCard label="Action taken" value={countByValue(reports, 'status', 'ACTION_TAKEN')} icon={IconCheck} accent="#ef4444" />
    </SimpleGrid>
  )
}

interface CommentFiltersProps {
  search: string
  status: StatusFilter
  reason: ReasonFilter
  onSearchChange: (value: string) => void
  onStatusChange: (value: StatusFilter) => void
  onReasonChange: (value: ReasonFilter) => void
}

function CommentFilters({
  search,
  status,
  reason,
  onSearchChange,
  onStatusChange,
  onReasonChange,
}: CommentFiltersProps) {
  return (
    <Panel mb={16} style={filtersPanelStyle}>
      <Group gap={12} wrap="wrap">
        <TextInput
          placeholder="Search by comment, user, or report message..."
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          leftSection={<IconSearch size={14} color="#6b7280" />}
          style={searchInputStyle}
          size="sm"
          aria-label="Search reported comments"
          styles={darkInputStyles}
        />
        <Select
          placeholder="All Statuses"
          data={statusFilterOptions}
          value={status}
          onChange={(value) => onStatusChange((value ?? ALL) as StatusFilter)}
          w={150}
          size="sm"
          clearable={false}
          styles={darkInputStyles}
        />
        <Select
          placeholder="All Reasons"
          data={reasonFilterOptions}
          value={reason}
          onChange={(value) => onReasonChange((value ?? ALL) as ReasonFilter)}
          w={180}
          size="sm"
          clearable={false}
          styles={darkInputStyles}
        />
      </Group>
    </Panel>
  )
}

function CommentsTable({
  reports,
  onOpenProfile,
  onStatusChange,
}: {
  reports: ReportedComment[]
  onOpenProfile: (userId: string) => void
  onStatusChange: (id: string, status: CommentReportStatus) => void
}) {
  return (
    <Panel style={panelOverflowStyle}>
      <Box px={20} py={14} style={panelHeaderStyle}>
        <Group gap={6}>
          <IconMessageReport size={14} color="#6b7280" />
          <Text size="xs" c="#6b7280">
            {reports.length} report{reports.length !== 1 ? 's' : ''} matching filters
          </Text>
        </Group>
      </Box>

      {reports.length === 0 ? (
        <EmptyCommentsTable />
      ) : (
        <div style={tableScrollStyle}>
          <table style={tableStyle}>
            <TableHeaderRow columns={TABLE_COLUMNS} />
            <tbody>
              {reports.map((report, index) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  isLast={index === reports.length - 1}
                  onOpenProfile={onOpenProfile}
                  onStatusChange={onStatusChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

function EmptyCommentsTable() {
  return (
    <Box py={60} style={emptyStateStyle}>
      <IconMessageReport size={32} color="#374151" style={emptyIconStyle} />
      <Text c="#4b5563" size="sm">
        Nothing here — no comments match these filters.
      </Text>
    </Box>
  )
}

interface ReportRowProps {
  report: ReportedComment
  isLast: boolean
  onOpenProfile: (userId: string) => void
  onStatusChange: (id: string, status: CommentReportStatus) => void
}

function ReportRow({ report, isLast, onOpenProfile, onStatusChange }: ReportRowProps) {
  return (
    <tr
      style={rowStyle(isLast)}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#1c2128' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
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
        <Text size="xs" c="#6b7280">{formatDate(report.date, { withTime: true })}</Text>
      </td>

      <td style={cellStyle}>
        <Select
          size="xs"
          value={report.status}
          data={statusSelectOptions}
          styles={statusSelectStyles(report.status)}
          onChange={(val) => val && onStatusChange(report.id, val as CommentReportStatus)}
        />
      </td>
    </tr>
  )
}

function CommentPreview({ report }: { report: ReportedComment }) {
  const hasTooltip = report.commentContent.length > 80

  return (
    <>
      <Tooltip
        label={report.commentContent}
        multiline
        w={340}
        withArrow
        disabled={!hasTooltip}
      >
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
