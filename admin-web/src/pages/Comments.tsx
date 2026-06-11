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
  UnstyledButton,
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
  getReportedComments,
  updateCommentReportStatus,
  type ReportedComment,
  type CommentReportStatus,
  type ReportReason,
} from '../api/comments'
import UserProfileModal from '../components/UserProfileModal'

const statusColor: Record<CommentReportStatus, string> = {
  Pending: 'orange',
  Reviewed: 'blue',
  Dismissed: 'gray',
  Removed: 'red',
}

const reasonColor: Record<ReportReason, string> = {
  Spam: 'yellow',
  Harassment: 'red',
  'Hate Speech': 'red',
  Misinformation: 'orange',
  Inappropriate: 'grape',
  Other: 'gray',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ALL = 'All'

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ElementType
  accent: string
}) {
  return (
    <Box
      style={{
        background: '#161b22',
        border: '1px solid #21262d',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <Box
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${accent}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={accent} />
      </Box>
      <div>
        <Text fw={700} c="#f1f5f9" style={{ fontSize: 22, lineHeight: 1 }}>
          {value}
        </Text>
        <Text size="xs" c="#6b7280" mt={2}>
          {label}
        </Text>
      </div>
    </Box>
  )
}

function UserChip({ id, name, role, warningCount, status, onClick }: {
  id: number
  name: string
  role: string
  warningCount: number
  status: string
  onClick: (id: number) => void
}) {
  const roleColor: Record<string, string> = {
    Admin: '#3b82f6',
    Professor: '#8b5cf6',
    Student: '#6b7280',
  }
  return (
    <UnstyledButton
      onClick={(e) => { e.stopPropagation(); onClick(id) }}
      style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}
    >
      <Text
        size="sm"
        fw={500}
        c="#e2e8f0"
        style={{
          textDecoration: 'underline',
          textDecorationColor: 'rgba(255,255,255,0.15)',
          cursor: 'pointer',
        }}
      >
        {name}
      </Text>
      <Group gap={4}>
        <Text size="xs" style={{ color: roleColor[role] ?? '#6b7280' }}>{role}</Text>
        {warningCount > 0 && (
          <Badge size="xs" color="yellow" variant="light">{warningCount}⚠</Badge>
        )}
        {status === 'Blocked' && (
          <Badge size="xs" color="red" variant="light">Blocked</Badge>
        )}
      </Group>
    </UnstyledButton>
  )
}

export default function CommentsPage() {
  const [reports, setReports] = useState<ReportedComment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>(ALL)
  const [filterReason, setFilterReason] = useState<string>(ALL)

  const [profileUserId, setProfileUserId] = useState<number | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    getReportedComments().then((data) => {
      setReports(data)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return reports.filter((r) => {
      const matchesSearch =
        !q ||
        r.commentText.toLowerCase().includes(q) ||
        r.reportedUser.name.toLowerCase().includes(q) ||
        r.reportingUser.name.toLowerCase().includes(q) ||
        r.postContext.toLowerCase().includes(q) ||
        r.reportMessage.toLowerCase().includes(q)
      const matchesStatus = filterStatus === ALL || r.status === filterStatus
      const matchesReason = filterReason === ALL || r.reason === filterReason
      return matchesSearch && matchesStatus && matchesReason
    })
  }, [reports, search, filterStatus, filterReason])

  async function handleStatusChange(id: number, status: CommentReportStatus) {
    await updateCommentReportStatus(id, status)
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  function openProfile(userId: number) {
    setProfileUserId(userId)
    setProfileOpen(true)
  }

  const counts = useMemo(
    () => ({
      pending: reports.filter((r) => r.status === 'Pending').length,
      reviewed: reports.filter((r) => r.status === 'Reviewed').length,
      dismissed: reports.filter((r) => r.status === 'Dismissed').length,
      removed: reports.filter((r) => r.status === 'Removed').length,
    }),
    [reports]
  )

  if (loading)
    return (
      <Center h={200}>
        <Loader color="green" />
      </Center>
    )

  return (
    <>
      <Text fw={700} c="#f1f5f9" mb={4} style={{ fontSize: 28, lineHeight: 1.1 }}>
        Reported Comments
      </Text>
      <Text size="sm" c="#6b7280" mb={28}>
        User-flagged comments awaiting moderation. Click a user name to view their profile.
      </Text>

      <SimpleGrid cols={4} spacing={14} mb={28}>
        <StatCard label="Pending" value={counts.pending} icon={IconClock} accent="#f97316" />
        <StatCard label="Reviewed" value={counts.reviewed} icon={IconEye} accent="#3b82f6" />
        <StatCard label="Dismissed" value={counts.dismissed} icon={IconX} accent="#6b7280" />
        <StatCard label="Removed" value={counts.removed} icon={IconCheck} accent="#ef4444" />
      </SimpleGrid>

      {/* Filters */}
      <Box
        mb={16}
        style={{
          background: '#161b22',
          border: '1px solid #21262d',
          borderRadius: 12,
          padding: '14px 20px',
        }}
      >
        <Group gap={12} wrap="wrap">
          <TextInput
            placeholder="Search by comment, user, post, or report message..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            leftSection={<IconSearch size={14} color="#6b7280" />}
            style={{ flex: 1, minWidth: 200 }}
            size="sm"
            styles={{ input: { background: '#0f1117', border: '1px solid #21262d', color: '#e2e8f0' } }}
          />
          <Select
            placeholder="All Statuses"
            data={[ALL, 'Pending', 'Reviewed', 'Dismissed', 'Removed']}
            value={filterStatus}
            onChange={(v) => setFilterStatus(v ?? ALL)}
            w={150}
            size="sm"
            clearable={false}
            styles={{ input: { background: '#0f1117', border: '1px solid #21262d', color: '#e2e8f0' } }}
          />
          <Select
            placeholder="All Reasons"
            data={[ALL, 'Spam', 'Harassment', 'Hate Speech', 'Misinformation', 'Inappropriate', 'Other']}
            value={filterReason}
            onChange={(v) => setFilterReason(v ?? ALL)}
            w={165}
            size="sm"
            clearable={false}
            styles={{ input: { background: '#0f1117', border: '1px solid #21262d', color: '#e2e8f0' } }}
          />
        </Group>
      </Box>

      {/* Table */}
      <Box
        style={{
          background: '#161b22',
          border: '1px solid #21262d',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
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
              <thead>
                <tr style={{ borderBottom: '1px solid #21262d' }}>
                  {['Comment & Report', 'Reported user', 'Reported by', 'Reason', 'Date', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 20px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((report, i) => (
                  <tr
                    key={report.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #1c2128' : 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#1c2128' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Comment + report message */}
                    <td style={{ padding: '16px 20px', maxWidth: 340 }}>
                      <Tooltip
                        label={report.commentText}
                        multiline
                        w={340}
                        withArrow
                        disabled={report.commentText.length <= 80}
                      >
                        <Text
                          size="sm"
                          c="#d1d5db"
                          lineClamp={2}
                          mb={4}
                          style={{
                            cursor: report.commentText.length > 80 ? 'help' : 'default',
                            wordBreak: 'break-word',
                          }}
                        >
                          "{report.commentText}"
                        </Text>
                      </Tooltip>
                      <Text size="xs" c="#4b5563" mb={6} style={{ wordBreak: 'break-word' }}>
                        in: {report.postContext}
                      </Text>
                      {report.reportMessage && (
                        <Box
                          style={{
                            background: 'rgba(239,68,68,0.06)',
                            border: '1px solid rgba(239,68,68,0.15)',
                            borderRadius: 6,
                            padding: '5px 8px',
                          }}
                        >
                          <Text size="xs" c="#fca5a5" lineClamp={2} style={{ wordBreak: 'break-word' }}>
                            Report: {report.reportMessage}
                          </Text>
                        </Box>
                      )}
                    </td>

                    {/* Reported user */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      <UserChip
                        id={report.reportedUser.id}
                        name={report.reportedUser.name}
                        role={report.reportedUser.role}
                        warningCount={report.reportedUser.warningCount}
                        status={report.reportedUser.status}
                        onClick={openProfile}
                      />
                    </td>

                    {/* Reporting user */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      <UserChip
                        id={report.reportingUser.id}
                        name={report.reportingUser.name}
                        role={report.reportingUser.role}
                        warningCount={report.reportingUser.warningCount}
                        status={report.reportingUser.status}
                        onClick={openProfile}
                      />
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <Badge color={reasonColor[report.reason]} variant="light" size="sm">
                        {report.reason}
                      </Badge>
                    </td>

                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      <Text size="xs" c="#6b7280">{formatDate(report.reportedAt)}</Text>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <Select
                        size="xs"
                        value={report.status}
                        data={['Pending', 'Reviewed', 'Dismissed', 'Removed']}
                        styles={{
                          input: {
                            background: '#0f1117',
                            border: '1px solid #21262d',
                            color: `var(--mantine-color-${statusColor[report.status]}-4)`,
                            fontWeight: 600,
                            fontSize: 11,
                          },
                        }}
                        onChange={(val) =>
                          val && handleStatusChange(report.id, val as CommentReportStatus)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Box>

      <UserProfileModal
        userId={profileUserId}
        opened={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  )
}
