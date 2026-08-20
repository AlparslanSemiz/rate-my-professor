import { useState } from 'react'
import { feedbackService, type BugReport, type BugReportUpdate } from '../../api/FeedbackService'
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

const LOAD_ERROR_MESSAGE = 'Failed to load bug reports'
const UPDATE_ERROR_MESSAGE = 'Failed to update the report. The change was not saved.'
const RE_READ_ERROR_FALLBACK = 'the report queue could not be read back'
const EMPTY_REPORTS: BugReport[] = []

function loadReports() {
  return feedbackService.getReports()
}

export default function FeedbackPage() {
  const {
    data: reports,
    setData: setReports,
    loading,
    error,
    retry,
  } = useAsyncData(loadReports, EMPTY_REPORTS, LOAD_ERROR_MESSAGE)
  const reportDetails = useSelectedId()
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
  async function applyUpdate(id: string, update: BugReportUpdate) {
    setReportUpdating(true)
    setUpdateError('')
    try {
      await feedbackService.updateReport(id, update)
    } catch (updateFailure: unknown) {
      setUpdateError(getErrorMessage(updateFailure, UPDATE_ERROR_MESSAGE))
      setReportUpdating(false)
      throw updateFailure
    }

    try {
      setReports(await feedbackService.getReports())
    } catch (readFailure: unknown) {
      setUpdateError(getStaleAfterWriteMessage(readFailure, RE_READ_ERROR_FALLBACK))
    } finally {
      setReportUpdating(false)
    }
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
      <ReportQueue reports={reports} onOpenReport={openReport} />

      <BugReportModal
        report={selectedReport}
        opened={reportDetails.opened}
        onClose={closeReport}
        onUpdate={handleReportUpdate}
        onEdit={applyUpdate}
        onDelete={() => setConfirmingDelete(true)}
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
