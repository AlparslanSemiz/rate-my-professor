import { useMemo, useState } from 'react'
import { Tabs } from '@mantine/core'
import { IconArchive, IconInbox } from '@tabler/icons-react'
import { feedbackService, type BugReport, type BugReportUpdate } from '../../api/FeedbackService'
import { systemStatusService } from '../../api/SystemStatusService'
import ConfirmModal from '../../components/ConfirmModal'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import PageLoader from '../../components/PageLoader'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useSelectedId } from '../../hooks/useSelectedId'
import { getErrorMessage, getStaleAfterWriteMessage } from '../../utils/getErrorMessage'
import BugReportModal from './components/BugReportModal'
import FeedbackStats from './components/FeedbackStats'
import ReportQueue from './components/ReportQueue'
import { closedReports, openReports } from './feedbackModel'

const LOAD_ERROR_MESSAGE = 'Failed to load bug reports'
const UPDATE_ERROR_MESSAGE = 'Failed to update the report. The change was not saved.'
const ISSUE_ERROR_MESSAGE = 'The issue could not be created. Nothing was opened on the board.'
const RE_READ_ERROR_FALLBACK = 'the report queue could not be read back'
const EMPTY_REPORTS: BugReport[] = []

function loadReports() {
  return feedbackService.getReports()
}

/**
 * Whether the backend holds GitLab credentials. Read once, and a failure reads as "off": the
 * endpoint answers `503` without them, and offering a button that cannot work is worse than
 * not offering one.
 */
async function loadGitlabEnabled() {
  return (await systemStatusService.getStatus()).gitlabEnabled
}

export default function FeedbackPage() {
  const {
    data: reports,
    setData: setReports,
    loading,
    error,
    retry,
  } = useAsyncData(loadReports, EMPTY_REPORTS, LOAD_ERROR_MESSAGE)
  const { data: gitlabEnabled } = useAsyncData(loadGitlabEnabled, false, '')
  const reportDetails = useSelectedId()
  const queue = useMemo(() => openReports(reports), [reports])
  const history = useMemo(() => closedReports(reports), [reports])
  const [reportUpdating, setReportUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function openReport(id: string) {
    reportDetails.open(id)
    setUpdateError('')
  }

  function closeReport() {
    reportDetails.close()
    setUpdateError('')
  }

  /**
   * Writes the edit, then shows what the backend now holds rather than what was sent: it is
   * free to trim a title or reject part of an update, and merging the request locally would
   * put a value on screen that nobody confirmed. There is no read for a single report, so the
   * queue is re-read whole.
   *
   * A failed re-read does not fail the action — the write already succeeded. The report stays
   * as last read and the modal says the view may be out of date.
   */
  async function runWrite(write: () => Promise<unknown>, failureMessage: string) {
    setReportUpdating(true)
    setUpdateError('')
    try {
      await write()
    } catch (writeFailure: unknown) {
      setUpdateError(getErrorMessage(writeFailure, failureMessage))
      setReportUpdating(false)
      throw writeFailure
    }

    try {
      setReports(await feedbackService.getReports())
    } catch (readFailure: unknown) {
      setUpdateError(getStaleAfterWriteMessage(readFailure, RE_READ_ERROR_FALLBACK))
    } finally {
      setReportUpdating(false)
    }
  }

  function applyUpdate(id: string, update: BugReportUpdate) {
    return runWrite(() => feedbackService.updateReport(id, update), UPDATE_ERROR_MESSAGE)
  }

  /**
   * The call is idempotent, so a second press is safe. The queue is re-read rather than
   * patched with the response: the report's own `issueUrl` and `issueState` are what the rest
   * of the screen reads, and they should come from a read like every other field does.
   */
  function createIssue(id: string) {
    void runWrite(() => feedbackService.createGitlabIssue(id), ISSUE_ERROR_MESSAGE).catch(
      () => undefined,
    )
  }

  function handleReportUpdate(id: string, update: BugReportUpdate) {
    // The status and severity selects fire and forget: the alert in the modal reports a
    // failure, and the value shown stays whatever the list still holds.
    void applyUpdate(id, update).catch(() => undefined)
  }

  async function handleDelete(id: string) {
    await feedbackService.deleteReport(id)
    setReports((current) => current.filter((report) => report.id !== id))
    setConfirmingDelete(false)
    closeReport()
  }

  if (loading) return <PageLoader />
  if (error) return <LoadError message={error} onRetry={retry} />

  const selectedReport = reports.find((report) => report.id === reportDetails.selectedId) ?? null

  return (
    <>
      <PageHeader
        title="Bug Reports"
        description="Bug reports and crash logs sent in by your users — screenshots, device info and all."
      />

      <FeedbackStats reports={reports} />

      {/* A report that has been acted on or dismissed is finished, and finished work should
          not sit in the queue competing for attention. It moves across on the re-read that
          every write already performs. */}
      <Tabs defaultValue="queue" keepMounted={false}>
        <Tabs.List mb={20}>
          <Tabs.Tab value="queue" leftSection={<IconInbox size={14} />}>
            Queue ({queue.length})
          </Tabs.Tab>
          <Tabs.Tab value="history" leftSection={<IconArchive size={14} />}>
            History ({history.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="queue">
          <ReportQueue
            reports={queue}
            title="Report queue"
            subtitle="Open and reviewed, newest first — tap a report for the full story."
            emptyMessage="All quiet — nothing waiting."
            onOpenReport={openReport}
          />
        </Tabs.Panel>

        <Tabs.Panel value="history">
          <ReportQueue
            reports={history}
            title="History"
            subtitle="Acted on or dismissed. The date is when the report was filed — the backend does not record when it was closed."
            emptyMessage="Nothing here yet — no report has been closed."
            onOpenReport={openReport}
          />
        </Tabs.Panel>
      </Tabs>

      <BugReportModal
        report={selectedReport}
        opened={reportDetails.opened}
        onClose={closeReport}
        onUpdate={handleReportUpdate}
        onEdit={applyUpdate}
        onDelete={() => setConfirmingDelete(true)}
        gitlabEnabled={gitlabEnabled}
        onCreateIssue={createIssue}
        updating={reportUpdating}
        updateError={updateError}
      />

      {confirmingDelete && selectedReport && (
        <ConfirmModal
          opened
          title="Delete bug report"
          description={`Delete "${selectedReport.title}"? This cannot be undone.`}
          confirmLabel="Delete report"
          confirmColor="red"
          onConfirm={() => handleDelete(selectedReport.id)}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </>
  )
}
