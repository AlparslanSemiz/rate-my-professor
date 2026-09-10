import { useMemo } from 'react'
import { Tabs } from '@mantine/core'
import { IconArchive, IconInbox } from '@tabler/icons-react'
import ConfirmModal from '@/components/ConfirmModal'
import LoadError from '@/components/LoadError'
import PageHeader from '@/components/PageHeader'
import PageLoader from '@/components/PageLoader'
import { useSelectedId } from '@/hooks/useSelectedId'
import BugReportModal from './components/BugReportModal'
import FeedbackStats from './components/FeedbackStats'
import ReportQueue from './components/ReportQueue'
import { closedReports, openReports } from './model'
import { useFeedbackReportActions } from './hooks/useFeedbackReportActions'
import { useFeedbackReports } from './hooks/useFeedbackReports'
import { iconSize } from '@/theme'

export default function FeedbackPage() {
  const { reports, gitlabEnabled, loading, error, retry } = useFeedbackReports()
  const reportDetails = useSelectedId()
  const queue = useMemo(() => openReports(reports), [reports])
  const history = useMemo(() => closedReports(reports), [reports])
  const reportActions = useFeedbackReportActions({ onDeleted: reportDetails.close })

  function openReport(id: string) {
    reportDetails.open(id)
    reportActions.clearUpdateError()
  }

  function closeReport() {
    reportDetails.close()
    reportActions.clearUpdateError()
  }

  if (loading) return <PageLoader />
  if (error) return <LoadError message={error} onRetry={retry} />

  const selectedReport = reports.find((report) => report.id === reportDetails.selectedId) ?? null

  return (
    <>
      <PageHeader
        title="Bug Reports"
        description="Bug reports and crash logs sent in by your users: screenshots, device info and all."
      />

      <FeedbackStats reports={reports} />

      {/* A report that has been acted on or dismissed is finished, and finished work should
          not sit in the queue competing for attention. It moves across on the re-read that
          every write already performs. */}
      <Tabs defaultValue="queue" keepMounted={false}>
        <Tabs.List mb={20}>
          <Tabs.Tab value="queue" leftSection={<IconInbox size={iconSize.inline} />}>
            Queue ({queue.length})
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconArchive size={iconSize.inline} />}>
            History ({history.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="queue">
          <ReportQueue
            reports={queue}
            title="Report queue"
            subtitle="Open and reviewed, newest first. Tap a report for the full story."
            emptyMessage="All quiet. Nothing waiting."
            onOpenReport={openReport}
          />
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <ReportQueue
            reports={history}
            title="History"
            subtitle="Acted on or dismissed. The date is when the report was filed; the backend does not record when it was closed."
            emptyMessage="Nothing here yet. No report has been closed."
            onOpenReport={openReport}
          />
        </Tabs.Panel>
      </Tabs>

      <BugReportModal
        report={selectedReport}
        opened={reportDetails.opened}
        onClose={closeReport}
        onUpdate={reportActions.handleReportUpdate}
        onEdit={reportActions.applyUpdate}
        onDelete={reportActions.requestDelete}
        gitlabEnabled={gitlabEnabled}
        onCreateIssue={reportActions.createIssue}
        updating={reportActions.reportUpdating}
        updateError={reportActions.updateError}
      />

      {reportActions.confirmingDelete && selectedReport && (
        <ConfirmModal
          opened
          title="Delete bug report"
          description={`Delete "${selectedReport.title}"? This cannot be undone.`}
          confirmLabel="Delete report"
          confirmColor="red"
          onConfirm={() => reportActions.deleteReport(selectedReport.id)}
          onClose={reportActions.cancelDelete}
        />
      )}
    </>
  )
}
