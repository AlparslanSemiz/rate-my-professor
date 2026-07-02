import { useEffect, useState, useMemo } from 'react'
import {
  Badge,
  Text,
  Select,
  TextInput,
  Group,
  Loader,
  Center,
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
import StatCard from '../components/StatCard'
import UserChip from '../components/UserChip'
import Panel from '../components/Panel'
import PageHeader from '../components/PageHeader'
import TableHeaderRow from '../components/TableHeaderRow'
import { reportStatusColor, reportReasonColor } from '../constants/colors'
import { darkInputStyles } from '../constants/inputStyles'
import { formatDate } from '../utils/formatDate'
import { enumLabel } from '../utils/enumLabel'
import { useSearch } from '../hooks/useSearch'

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
const TABLE_COLUMNS = ['Comment & Report', 'Reported user', 'Reported by', 'Reason', 'Date', 'Status']

function matchesQuery(report: ReportedComment, query: string) {
  return (
    report.commentContent.toLowerCase().includes(query) ||
    report.reportedUser.name.toLowerCase().includes(query) ||
    report.reporter.name.toLowerCase().includes(query) ||
    report.reportText.toLowerCase().includes(query)
  )
}

function countByStatus(reports: ReportedComment[], status: CommentReportStatus) {
  return reports.filter((r) => r.status === status).length
}

export default function CommentsPage() {
  const [reports, setReports] = useState<ReportedComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [filterStatus, setFilterStatus] = useState<string>(ALL)
  const [filterReason, setFilterReason] = useState<string>(ALL)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  const { search, setSearch, filtered: searchFiltered } = useSearch(reports, matchesQuery)

  const filtered = useMemo(
    () =>
      searchFiltered.filter(
        (r) =>
          (filterStatus === ALL || r.status === filterStatus) &&
          (filterReason === ALL || r.reason === filterReason)
      ),
    [searchFiltered, filterStatus, filterReason]
  )

  useEffect(() => {
    commentsService
      .getReported()
      .then(setReports)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load reported comments'))
      .finally(() => setLoading(false))
  }, [reloadKey])

  function retry() {
    setLoading(true)
    setError('')
    setReloadKey((k) => k + 1)
  }

  async function handleStatusChange(id: string, status: CommentReportStatus) {
    await commentsService.updateStatus(id, status)
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  function openProfile(userId: string) {
    setProfileUserId(userId)
    setProfileOpen(true)
  }

  if (loading)
    return (
      <Center h={200}>
        <Loader color="green" />
      </Center>
    )

  if (error) return <LoadError message={error} onRetry={retry} />

  return (
    <>
      <PageHeader
        title="Reported Comments"
        description="User-flagged comments awaiting moderation. Click a user name to view their profile."
      />

      <SimpleGrid cols={4} spacing={14} mb={28}>
        <StatCard label="Open" value={countByStatus(reports, 'OPEN')} icon={IconClock} accent="#f97316" />
        <StatCard label="Reviewed" value={countByStatus(reports, 'REVIEWED')} icon={IconEye} accent="#3b82f6" />
        <StatCard label="Dismissed" value={countByStatus(reports, 'DISMISSED')} icon={IconX} accent="#6b7280" />
        <StatCard label="Action taken" value={countByStatus(reports, 'ACTION_TAKEN')} icon={IconCheck} accent="#ef4444" />
      </SimpleGrid>

      <Panel mb={16} style={{ padding: '14px 20px' }}>
        <Group gap={12} wrap="wrap">
          <TextInput
            placeholder="Search by comment, user, or report message..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            leftSection={<IconSearch size={14} color="#6b7280" />}
            style={{ flex: 1, minWidth: 200 }}
            size="sm"
            styles={darkInputStyles}
          />
          <Select
            placeholder="All Statuses"
            data={[ALL, ...STATUS_OPTIONS.map((s) => ({ value: s, label: enumLabel(s) }))]}
            value={filterStatus}
            onChange={(v) => setFilterStatus(v ?? ALL)}
            w={150}
            size="sm"
            clearable={false}
            styles={darkInputStyles}
          />
          <Select
            placeholder="All Reasons"
            data={[ALL, ...REASON_OPTIONS.map((r) => ({ value: r, label: enumLabel(r) }))]}
            value={filterReason}
            onChange={(v) => setFilterReason(v ?? ALL)}
            w={180}
            size="sm"
            clearable={false}
            styles={darkInputStyles}
          />
        </Group>
      </Panel>

      <Panel style={{ overflow: 'hidden' }}>
        <Box px={20} py={14} style={{ borderBottom: '1px solid #21262d' }}>
          <Group gap={6}>
            <IconMessageReport size={14} color="#6b7280" />
            <Text size="xs" c="#6b7280">
              {filtered.length} report{filtered.length !== 1 ? 's' : ''} matching filters
            </Text>
          </Group>
        </Box>

        {filtered.length === 0 ? (
          <Box py={60} style={{ textAlign: 'center' }}>
            <IconMessageReport size={32} color="#374151" style={{ marginBottom: 12 }} />
            <Text c="#4b5563" size="sm">No reported comments match the current filters.</Text>
          </Box>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <TableHeaderRow columns={TABLE_COLUMNS} />
              <tbody>
                {filtered.map((report, i) => (
                  <ReportRow
                    key={report.id}
                    report={report}
                    isLast={i === filtered.length - 1}
                    onOpenProfile={openProfile}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <UserProfileModal
        userId={profileUserId}
        opened={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
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
      style={{ borderBottom: isLast ? 'none' : '1px solid #1c2128' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#1c2128' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <td style={{ padding: '16px 20px', maxWidth: 340 }}>
        <Tooltip
          label={report.commentContent}
          multiline
          w={340}
          withArrow
          disabled={report.commentContent.length <= 80}
        >
          <Text
            size="sm"
            c="#d1d5db"
            lineClamp={2}
            mb={4}
            style={{ cursor: report.commentContent.length > 80 ? 'help' : 'default', wordBreak: 'break-word' }}
          >
            "{report.commentContent}"
          </Text>
        </Tooltip>
        {report.reportText && (
          <Box style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, padding: '5px 8px' }}>
            <Text size="xs" c="#fca5a5" lineClamp={2} style={{ wordBreak: 'break-word' }}>
              Report: {report.reportText}
            </Text>
          </Box>
        )}
      </td>

      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
        <UserChip
          id={report.reportedUser.id}
          name={report.reportedUser.name}
          role={report.reportedUser.role}
          warningCount={report.reportedUser.warnings}
          status={report.reportedUser.status}
          onClick={onOpenProfile}
        />
      </td>

      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
        <UserChip
          id={report.reporter.id}
          name={report.reporter.name}
          role={report.reporter.role}
          warningCount={report.reporter.warnings}
          status={report.reporter.status}
          onClick={onOpenProfile}
        />
      </td>

      <td style={{ padding: '16px 20px' }}>
        <Badge color={reportReasonColor[report.reason]} variant="light" size="sm">
          {enumLabel(report.reason)}
        </Badge>
      </td>

      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
        <Text size="xs" c="#6b7280">{formatDate(report.date, { withTime: true })}</Text>
      </td>

      <td style={{ padding: '16px 20px' }}>
        <Select
          size="xs"
          value={report.status}
          data={STATUS_OPTIONS.map((s) => ({ value: s, label: enumLabel(s) }))}
          styles={{
            input: {
              background: '#0f1117',
              border: '1px solid #21262d',
              color: `var(--mantine-color-${reportStatusColor[report.status]}-4)`,
              fontWeight: 600,
              fontSize: 11,
            },
          }}
          onChange={(val) => val && onStatusChange(report.id, val as CommentReportStatus)}
        />
      </td>
    </tr>
  )
}
