import { useState, type Dispatch, type SetStateAction } from 'react'
import { feedbackService, type BugReport, type BugReportUpdate } from '@/api/feedback'
import { getErrorMessage, getStaleAfterWriteMessage } from '@/utils/getErrorMessage'

const UPDATE_ERROR_MESSAGE = 'Failed to update the report. The change was not saved.'
const ISSUE_ERROR_MESSAGE = 'The issue could not be created. Nothing was opened on the board.'
const RE_READ_ERROR_FALLBACK = 'the report queue could not be read back'

interface FeedbackReportActionsOptions {
  setReports: Dispatch<SetStateAction<BugReport[]>>
  onDeleted: () => void
}

export function useFeedbackReportActions({
  setReports,
  onDeleted,
}: FeedbackReportActionsOptions) {
  const [reportUpdating, setReportUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function clearUpdateError() {
    setUpdateError('')
  }

  /**
   * Writes the edit, then shows what the backend now holds rather than what was sent: it is
   * free to trim a title or reject part of an update, and merging the request locally would
   * put a value on screen that nobody confirmed. There is no read for a single report, so the
   * queue is re-read whole.
   *
   * A failed re-read does not fail the action: the write already succeeded. The report stays
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

  async function deleteReport(id: string) {
    await feedbackService.deleteReport(id)
    setReports((current) => current.filter((report) => report.id !== id))
    setConfirmingDelete(false)
    onDeleted()
  }

  return {
    reportUpdating,
    updateError,
    confirmingDelete,
    clearUpdateError,
    applyUpdate,
    handleReportUpdate,
    createIssue,
    requestDelete: () => setConfirmingDelete(true),
    cancelDelete: () => setConfirmingDelete(false),
    deleteReport,
  }
}
