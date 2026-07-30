import { useState } from 'react'
import { feedbackService, type BugReport, type BugReportUpdate } from '../../api/FeedbackService'
import ConfirmModal from '../../components/ConfirmModal'
import LoadError from '../../components/LoadError'
import PageHeader from '../../components/PageHeader'
import PageLoader from '../../components/PageLoader'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useSelectedId } from '../../hooks/useSelectedId'
import { updateById } from '../../utils/collection'
import { getErrorMessage } from '../../utils/getErrorMessage'
import BugReportModal from './components/BugReportModal'
import FeedbackStats from './components/FeedbackStats'
import ReportQueue from './components/ReportQueue'

const LOAD_ERROR_MESSAGE = 'Failed to load bug reports'
const UPDATE_ERROR_MESSAGE = 'Failed to update the report. The change was not saved.'
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

  async function applyUpdate(id: string, update: BugReportUpdate) {
    setReportUpdating(true)
    setUpdateError('')
    try {
      await feedbackService.updateReport(id, update)
      setReports((current) => updateById(current, id, (report) => ({ ...report, ...update })))
    } catch (updateFailure: unknown) {
      setUpdateError(getErrorMessage(updateFailure, UPDATE_ERROR_MESSAGE))
      throw updateFailure
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
