import { useEffect, useState, useMemo } from 'react'
import {
  Title,
  Table,
  Badge,
  Text,
  Select,
  TextInput,
  Group,
  Stack,
  Loader,
  Center,
  Tooltip,
  Paper,
  Flex,
  Box,
} from '@mantine/core'
import {
  getReportedComments,
  updateCommentReportStatus,
  type ReportedComment,
  type CommentReportStatus,
  type ReportReason,
} from '../api/comments'

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

interface StatCardProps {
  label: string
  value: number
  color: string
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <Paper withBorder radius="md" px="lg" py="sm" style={{ borderTop: `3px solid var(--mantine-color-${color}-6)` }}>
      <Text size="xl" fw={700} c={color}>{value}</Text>
      <Text size="xs" c="dimmed">{label}</Text>
    </Paper>
  )
}

export default function CommentsPage() {
  const [reports, setReports] = useState<ReportedComment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>(ALL)
  const [filterReason, setFilterReason] = useState<string>(ALL)

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
        r.commentAuthor.toLowerCase().includes(q) ||
        r.reportedBy.toLowerCase().includes(q) ||
        r.postContext.toLowerCase().includes(q)
      const matchesStatus = filterStatus === ALL || r.status === filterStatus
      const matchesReason = filterReason === ALL || r.reason === filterReason
      return matchesSearch && matchesStatus && matchesReason
    })
  }, [reports, search, filterStatus, filterReason])

  async function handleStatusChange(id: number, status: CommentReportStatus) {
    await updateCommentReportStatus(id, status)
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
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

  if (loading) return <Center h={200}><Loader /></Center>

  return (
    <>
      <Title order={2} mb="lg">Reported Comments</Title>

      <Group mb="lg" gap="sm" wrap="wrap">
        <StatCard label="Pending" value={counts.pending} color="orange" />
        <StatCard label="Reviewed" value={counts.reviewed} color="blue" />
        <StatCard label="Dismissed" value={counts.dismissed} color="gray" />
        <StatCard label="Removed" value={counts.removed} color="red" />
      </Group>

      <Paper withBorder p="sm" mb="md" radius="md">
        <Flex gap="sm" wrap="wrap" align="center">
          <TextInput
            placeholder="Search by comment, user, or post..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <Select
            placeholder="All Statuses"
            data={[ALL, 'Pending', 'Reviewed', 'Dismissed', 'Removed']}
            value={filterStatus}
            onChange={(v) => setFilterStatus(v ?? ALL)}
            w={150}
            clearable={false}
          />
          <Select
            placeholder="All Reasons"
            data={[ALL, 'Spam', 'Harassment', 'Hate Speech', 'Misinformation', 'Inappropriate', 'Other']}
            value={filterReason}
            onChange={(v) => setFilterReason(v ?? ALL)}
            w={165}
            clearable={false}
          />
        </Flex>
      </Paper>

      {filtered.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">No reported comments match the current filters.</Text>
        </Center>
      ) : (
        <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
          <Box style={{ overflowX: 'auto' }}>
            <Table
              striped
              highlightOnHover
              verticalSpacing="sm"
              horizontalSpacing="md"
              style={{ tableLayout: 'fixed', minWidth: 780 }}
            >
              <colgroup>
                <col style={{ width: '38%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>

              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Comment</Table.Th>
                  <Table.Th>Author</Table.Th>
                  <Table.Th>Reported By</Table.Th>
                  <Table.Th>Reason</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {filtered.map((report) => (
                  <Table.Tr key={report.id}>
                    <Table.Td>
                      <Stack gap={4}>
                        <Tooltip
                          label={report.commentText}
                          multiline
                          w={340}
                          withArrow
                          disabled={report.commentText.length <= 90}
                        >
                          <Text
                            size="sm"
                            lineClamp={2}
                            style={{ cursor: report.commentText.length > 90 ? 'help' : 'default', wordBreak: 'break-word' }}
                          >
                            {report.commentText}
                          </Text>
                        </Tooltip>
                        <Text size="xs" c="dimmed" style={{ wordBreak: 'break-word' }}>
                          {report.postContext}
                        </Text>
                      </Stack>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" fw={500} style={{ wordBreak: 'break-all' }}>
                        {report.commentAuthor}
                      </Text>
                      <Text size="xs" c="dimmed">#{report.commentAuthorId}</Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" fw={500} style={{ wordBreak: 'break-all' }}>
                        {report.reportedBy}
                      </Text>
                      {report.additionalNote && (
                        <Tooltip label={report.additionalNote} multiline w={260} withArrow>
                          <Text
                            size="xs"
                            c="dimmed"
                            lineClamp={1}
                            style={{ cursor: 'help', wordBreak: 'break-word' }}
                          >
                            {report.additionalNote}
                          </Text>
                        </Tooltip>
                      )}
                    </Table.Td>

                    <Table.Td>
                      <Badge color={reasonColor[report.reason]} variant="light" size="sm">
                        {report.reason}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {formatDate(report.reportedAt)}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Select
                        size="xs"
                        value={report.status}
                        data={['Pending', 'Reviewed', 'Dismissed', 'Removed']}
                        styles={{
                          input: { color: `var(--mantine-color-${statusColor[report.status]}-6)`, fontWeight: 600 },
                        }}
                        onChange={(val) =>
                          val && handleStatusChange(report.id, val as CommentReportStatus)
                        }
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        </Paper>
      )}
    </>
  )
}
