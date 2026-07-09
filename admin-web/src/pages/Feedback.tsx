import { useEffect, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { Text, Badge, Box, SimpleGrid, Group } from '@mantine/core'
import { IconBug, IconAlertCircle, IconCircleCheck, IconClock } from '@tabler/icons-react'
import { feedbackService, type BugReport, type BugReportUpdate } from '../api/FeedbackService'
import StatCard from '../components/StatCard'
import LoadError from '../components/LoadError'
import PageLoader from '../components/PageLoader'
import Panel from '../components/Panel'
import PageHeader from '../components/PageHeader'
import BugReportModal from '../components/BugReportModal'
import { severityColor, severityAccent, reportStatusColor } from '../constants/colors'
import { formatDate } from '../utils/formatDate'
import { enumLabel } from '../utils/enumLabel'
import { getErrorMessage } from '../utils/getErrorMessage'
import { countByValue, updateById } from '../utils/collection'
import { statGridCols } from '../constants/layout'

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

export default function FeedbackPage() {
  const [reports, setReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusError, setStatusError] = useState('')

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

  function openReport(id: string) {
    setSelectedReportId(id)
    setDetailOpen(true)
    setStatusError('')
  }

  function closeReport() {
    setDetailOpen(false)
    setStatusError('')
  }

  async function handleReportUpdate(id: string, update: BugReportUpdate) {
    setStatusUpdating(true)
    setStatusError('')
    try {
      await feedbackService.updateReport(id, update)
      setReports((prev) => updateById(prev, id, (report) => ({ ...report, ...update })))
    } catch (err: unknown) {
      setStatusError(getErrorMessage(err, 'Failed to update the report. The change was not saved.'))
    } finally {
      setStatusUpdating(false)
    }
  }

  if (loading) return <PageLoader />

  if (error) return <LoadError message={error} onRetry={retry} />

  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? null

  return (
    <div>
      <PageHeader
        title="Bug Reports"
        description="User-submitted bug forms, screenshots, device info and automatic crash logs."
      />

      <FeedbackStats reports={reports} />
      <ReportQueue reports={reports} onOpenReport={openReport} />

      <BugReportModal
        report={selectedReport}
        opened={detailOpen}
        onClose={closeReport}
        onUpdate={handleReportUpdate}
        statusUpdating={statusUpdating}
        statusError={statusError}
      />
    </div>
  )
}

function FeedbackStats({ reports }: { reports: BugReport[] }) {
  return (
    <SimpleGrid cols={statGridCols} spacing={14} mb={28}>
      <StatCard label="Total reports" value={reports.length} icon={IconBug} accent="#f97316" />
      <StatCard label="Open" value={countByValue(reports, 'status', 'OPEN')} icon={IconAlertCircle} accent="#ef4444" />
      <StatCard label="Reviewed" value={countByValue(reports, 'status', 'REVIEWED')} icon={IconClock} accent="#3b82f6" />
      <StatCard label="Action taken" value={countByValue(reports, 'status', 'ACTION_TAKEN')} icon={IconCircleCheck} accent="#22c55e" />
    </SimpleGrid>
  )
}

function ReportQueue({
  reports,
  onOpenReport,
}: {
  reports: BugReport[]
  onOpenReport: (id: string) => void
}) {
  return (
    <Panel style={panelOverflowStyle}>
      <Box px={20} py={16} style={panelHeaderStyle}>
        <Text fw={600} c="#e2e8f0" size="sm">
          Report queue
        </Text>
        <Text size="xs" c="#4b5563">
          Newest entries shown first · click a report to view details.
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
              onOpenReport={onOpenReport}
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
  onOpenReport: (id: string) => void
}

function reportRowStyle(isLast: boolean): CSSProperties {
  return {
    borderBottom: isLast ? 'none' : '1px solid #1c2128',
    cursor: 'pointer',
    transition: 'background 0.1s',
  }
}

function handleReportKeyDown(event: KeyboardEvent<HTMLDivElement>, onOpen: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onOpen()
  }
}

function ReportItem({ report, isLast, onOpenReport }: ReportItemProps) {
  const openReport = () => onOpenReport(report.id)

  return (
    <Box
      px={20}
      py={18}
      style={reportRowStyle(isLast)}
      onMouseEnter={(event) => { event.currentTarget.style.background = '#1c2128' }}
      onMouseLeave={(event) => { event.currentTarget.style.background = 'transparent' }}
      onClick={openReport}
      onKeyDown={(event) => handleReportKeyDown(event, openReport)}
      tabIndex={0}
    >
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
        <Text size="xs" c="#4b5563">
          {formatDate(report.reportedAt, { withTime: true })}
        </Text>
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
