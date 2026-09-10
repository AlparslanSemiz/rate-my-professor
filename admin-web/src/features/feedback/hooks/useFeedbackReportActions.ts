import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { feedbackService, type BugReportUpdate } from '@/api/feedback'
import { getErrorMessage, getStaleAfterWriteMessage } from '@/utils/getErrorMessage'
import { feedbackKeys } from './feedbackKeys'

const UPDATE_ERROR_MESSAGE = 'Failed to update the report. The change was not saved.'
const ISSUE_ERROR_MESSAGE = 'The issue could not be created. Nothing was opened on the board.'
const RE_READ_ERROR_FALLBACK = 'the report queue could not be read back'

interface FeedbackReportActionsOptions {
  onDeleted: () => void
}

/**
 * The writes the bug report screen can make.
 *
 * Every one of them re-reads the queue, because the backend owns the result: it is free to
 * trim a title or reject part of an update, and merging the request locally would put a value
 * on screen that nobody confirmed. There is no read for a single report, so the queue is
 * re-read whole.
 */
export function useFeedbackReportActions({ onDeleted }: FeedbackReportActionsOptions) {
  const queryClient = useQueryClient()
  const [staleMessage, setStaleMessage] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  /**
   * A failed read-back does not fail the write — the write already succeeded. The report
   * stays as last read and the modal says only that the view may be out of date. This is why
   * the refetch is awaited here rather than left to `invalidateQueries`: an invalidation
   * cannot tell the two apart, and reporting an accepted change as refused is the worse
   * error of the two.
   */
  const readBack = useCallback(async () => {
    try {
      // `throwOnError` because a refetch resolves quietly by default, and this needs to
      // know: a failed read-back is reported differently from a failed write.
      await queryClient.refetchQueries({ queryKey: feedbackKeys.reports() }, { throwOnError: true })
      setStaleMessage('')
    } catch (readFailure: unknown) {
      setStaleMessage(getStaleAfterWriteMessage(readFailure, RE_READ_ERROR_FALLBACK))
    }
  }, [queryClient])

  const updateReport = useMutation({
    mutationFn: ({ id, update }: { id: string; update: BugReportUpdate }) =>
      feedbackService.updateReport(id, update),
    onSuccess: readBack,
  })

  /**
   * The call is idempotent, so a second press is safe. The queue is re-read rather than
   * patched with the response: the report's own `issueUrl` and `issueState` are what the rest
   * of the screen reads, and they should come from a read like every other field does.
   */
  const createIssue = useMutation({
    mutationFn: (id: string) => feedbackService.createGitlabIssue(id),
    onSuccess: readBack,
  })

  const deleteReport = useMutation({
    mutationFn: (id: string) => feedbackService.deleteReport(id),
    onSuccess: async () => {
      setConfirmingDelete(false)
      onDeleted()
      await readBack()
    },
  })

  // A refused delete is deliberately absent here. `ConfirmModal` awaits `deleteReport` and
  // reports a refusal in place, next to the button that was pressed — reporting it a second
  // time in the detail modal behind it would say it twice.
  const failure = updateReport.error ?? createIssue.error

  const messageFor = () =>
    updateReport.error
      ? getErrorMessage(updateReport.error, UPDATE_ERROR_MESSAGE)
      : getErrorMessage(createIssue.error, ISSUE_ERROR_MESSAGE)

  const clearUpdateError = useCallback(() => {
    setStaleMessage('')
    updateReport.reset()
    createIssue.reset()
    deleteReport.reset()
    // `reset` is stable on a mutation result, so this only ever runs on an explicit clear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    reportUpdating: updateReport.isPending || createIssue.isPending,
    updateError: failure ? messageFor() : staleMessage,
    confirmingDelete,
    clearUpdateError,
    /** Awaited by the edit form, which keeps itself open when the write is refused. */
    applyUpdate: async (id: string, update: BugReportUpdate) => {
      await updateReport.mutateAsync({ id, update })
    },
    /**
     * Fire-and-forget: the status and severity selects are driven by the reloaded queue, so a
     * refusal needs no rollback — the select keeps showing what the backend still holds, and
     * the alert in the modal reports the failure.
     */
    handleReportUpdate: (id: string, update: BugReportUpdate) => {
      updateReport.mutate({ id, update })
    },
    createIssue: (id: string) => {
      createIssue.mutate(id)
    },
    requestDelete: () => setConfirmingDelete(true),
    cancelDelete: () => setConfirmingDelete(false),
    deleteReport: async (id: string) => {
      await deleteReport.mutateAsync(id)
    },
  }
}
