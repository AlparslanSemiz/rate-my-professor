import { useEffect, useState, type CSSProperties } from 'react'
import { Text, Badge, Box, SimpleGrid, Select, Group } from '@mantine/core'
import { IconBug, IconAlertCircle, IconCircleCheck, IconClock } from '@tabler/icons-react'
import { feedbackService, type BugReport, type ReportStatus } from '../api/FeedbackService'
import StatCard from '../components/StatCard'
import LoadError from '../components/LoadError'
import PageLoader from '../components/PageLoader'
import Panel from '../components/Panel'
import PageHeader from '../components/PageHeader'
import { severityColor, severityAccent, reportStatusColor } from '../constants/colors'
import { formatDate } from '../utils/formatDate'
import { enumLabel } from '../utils/enumLabel'
import { getErrorMessage } from '../utils/getErrorMessage'
import { statGridCols } from '../constants/layout'

const STATUS_OPTIONS: ReportStatus[] = ['OPEN', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN']
const LOAD_ERROR_MESSAGE = 'Failed to load bug reports'

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

const severityBarStyle: CSSProperties = {
  width: 3,
  height: 36,
  borderRadius: 2,
  flexShrink: 0,
}

const statusSelectStyles = {
  input: {
    background: '#0f1117',
    border: '1px solid #21262d',
    color: '#e2e8f0',
    fontSize: 12,
  },
}

function countByStatus(reports: BugReport[], status: ReportStatus) {
  return reports.filter((r) => r.status === status).length
}

function updateReportStatus(reports: BugReport[], id: string, status: ReportStatus) {
  return reports.map((report) => (report.id === id ? { ...report, status } : report))
}

export default function FeedbackPage() {
  const [reports, setReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    feedbackService
      .getReports()
      .then(setReports)
      .catch((err: unknown) => setError(getErrorMessage(err, LOAD_ERROR_MESSAGE)))
      .finally(() => setLoading(false))
  }, [reloadKey])

  function retry() {
    setLoading(true)
    setError('')
    setReloadKey((k) => k + 1)
  }

  async function handleStatusChange(id: string, status: ReportStatus) {
    await feedbackService.updateStatus(id, status)
    setReports((prev) => updateReportStatus(prev, id, status))
  }

  if (loading) return <PageLoader />

  if (error) return <LoadError message={error} onRetry={retry} />

  return (
    <div>
      <PageHeader
        title="Bug Reports"
        description="User-submitted bug forms, screenshots, device info and automatic crash logs."
      />

      <FeedbackStats reports={reports} />
      <ReportQueue reports={reports} onStatusChange={handleStatusChange} />
    </div>
  )
}

function FeedbackStats({ reports }: { reports: BugReport[] }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard label="Total reports" value={reports.length} icon={IconBug} accent="#f97316" />
      <StatCard label="Open" value={countByStatus(reports, 'OPEN')} icon={IconAlertCircle} accent="#ef4444" />
      <StatCard label="Reviewed" value={countByStatus(reports, 'REVIEWED')} icon={IconClock} accent="#3b82f6" />
      <StatCard label="Action taken" value={countByStatus(reports, 'ACTION_TAKEN')} icon={IconCircleCheck} accent="#22c55e" />
    </SimpleGrid>
  )
}

function ReportQueue({
  reports,
  onStatusChange,
}: {
  reports: BugReport[]
  onStatusChange: (id: string, status: ReportStatus) => void
}) {
  return (
    <Panel style={panelOverflowStyle}>
      <Box px={20} py={16} style={panelHeaderStyle}>
        <Text fw={600} c="#e2e8f0" size="sm">
          Report queue
        </Text>
        <Text size="xs" c="#4b5563">
          Newest entries shown first.
        </Text>
      </Box>

      {reports.length === 0 ? (
        <EmptyReportQueue />
      ) : (
        <div>
          {reports.map((report, index) => (
            <ReportItem
              key={report.id}
              report={report}
              isLast={index === reports.length - 1}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </Panel>
  )
}

function EmptyReportQueue() {
  return (
    <Box py={60} style={emptyStateStyle}>
      <IconBug size={32} color="#374151" style={emptyIconStyle} />
      <Text c="#4b5563" size="sm">
        No bug reports yet.
      </Text>
    </Box>
  )
}

interface ReportItemProps {
  report: BugReport
  isLast: boolean
  onStatusChange: (id: string, status: ReportStatus) => void
}

function ReportItem({ report, isLast, onStatusChange }: ReportItemProps) {
  return (
    <Box px={20} py={18} style={{ borderBottom: isLast ? 'none' : '1px solid #1c2128' }}>
      <Group justify="space-between" mb={8}>
        <Group gap={8}>
          <Box
            style={{
              ...severityBarStyle,
              background: severityAccent[report.severity] ?? '#6b7280',
            }}
          />
          <div>
            <Text fw={600} c="#e2e8f0" size="sm">
              {report.title}
            </Text>
            <Group gap={6} mt={2}>
              <Badge color={severityColor[report.severity]} variant="light" size="xs">
                {enumLabel(report.severity)}
              </Badge>
              <Badge color={reportStatusColor[report.status]} variant="light" size="xs">
                {enumLabel(report.status)}
              </Badge>
            </Group>
          </div>
        </Group>
        <Group gap={10} align="center">
          <Text size="xs" c="#4b5563">
            {formatDate(report.reportedAt, { withTime: true })}
          </Text>
          <Select
            size="xs"
            w={140}
            value={report.status}
            data={STATUS_OPTIONS.map((s) => ({ value: s, label: enumLabel(s) }))}
            styles={statusSelectStyles}
            onChange={(val) => val && onStatusChange(report.id, val as ReportStatus)}
          />
        </Group>
      </Group>
      <Text size="sm" c="#6b7280" ml={11}>
        {report.description}
      </Text>
      <Text size="xs" c="#374151" mt={6} ml={11}>
        Reported by {report.reporterName}
      </Text>
    </Box>
  )
}
