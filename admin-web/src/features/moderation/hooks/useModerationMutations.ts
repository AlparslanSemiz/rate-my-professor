import { useCallback, useState } from 'react'
import type { ContentUpdate } from '../../../api/CommentsService'
import type { ReportStatus } from '../../../domain/moderation'
import { getErrorMessage } from '../../../utils/getErrorMessage'
import type { ModeratedItem, ReportItem } from '../moderationModel'
import type { ModerationApi } from './moderationApi'

interface ModerationMutationOptions {
  api: ModerationApi
  refreshContent: () => Promise<void>
  refreshReports: () => Promise<void>
}

export function useModerationMutations({
  api,
  refreshContent,
  refreshReports,
}: ModerationMutationOptions) {
  const [mutating, setMutating] = useState(false)
  const [actionError, setActionError] = useState('')

  const run = useCallback(
    async (mutate: () => Promise<unknown>, refresh: () => Promise<void>, failure: string) => {
      setMutating(true)
      setActionError('')
      try {
        await mutate()
        await refresh()
      } catch (error: unknown) {
        setActionError(getErrorMessage(error, failure))
        throw error
      } finally {
        setMutating(false)
      }
    },
    [],
  )

  const refreshBoth = useCallback(async () => {
    await Promise.all([refreshContent(), refreshReports()])
  }, [refreshContent, refreshReports])

  const editContent = useCallback(
    (item: ModeratedItem, update: ContentUpdate) =>
      run(
        () => api.updateContent(item, update),
        refreshBoth,
        'The change could not be saved.',
      ),
    [api, refreshBoth, run],
  )

  const deleteContent = useCallback(
    (item: ModeratedItem) =>
      run(() => api.deleteContent(item), refreshBoth, 'The content could not be deleted.'),
    [api, refreshBoth, run],
  )

  const changeReportStatus = useCallback(
    (report: ReportItem, status: ReportStatus) => {
      void run(
        () => api.updateReportStatus(report, status),
        refreshBoth,
        'Failed to update the report. The change was not saved.',
      ).catch(() => {
        // The status select is driven by the reloaded list, so a failure needs no rollback.
      })
    },
    [api, refreshBoth, run],
  )

  const withdrawReport = useCallback(
    (report: ReportItem) =>
      run(() => api.deleteReport(report), refreshReports, 'The report could not be withdrawn.'),
    [api, refreshReports, run],
  )

  return {
    mutating,
    actionError,
    editContent,
    deleteContent,
    changeReportStatus,
    withdrawReport,
  }
}
