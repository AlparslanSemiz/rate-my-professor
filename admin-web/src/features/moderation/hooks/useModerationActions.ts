import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ContentUpdate } from '@/api/moderation'
import type { ReportStatus } from '@/domain/moderation'
import { getErrorMessage } from '@/utils/getErrorMessage'
import type { ModeratedItem, ReportItem } from '../model'
import { moderationKeys } from './moderationKeys'
import type { ModerationApi } from './moderationApi'

interface ActionOptions {
  api: ModerationApi
  resource: string
}

/**
 * The writes a moderation screen can make.
 *
 * All four re-read **both** lists, because the two are views of the same records: setting a
 * report to `ACTION_TAKEN` hides the content behind it, and withdrawing a report leaves
 * content whose report count has changed. Only the withdrawal is narrower — it touches the
 * report and deliberately leaves the content exactly as it is.
 */
export function useModerationActions({ api, resource }: ActionOptions) {
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    (keys: readonly (readonly string[])[]) =>
      Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
    [queryClient],
  )

  const bothLists = useCallback(
    () => invalidate([moderationKeys.content(resource), moderationKeys.reports(resource)]),
    [invalidate, resource],
  )

  const editContent = useMutation({
    mutationFn: ({ item, update }: { item: ModeratedItem; update: ContentUpdate }) =>
      api.updateContent(item, update),
    onSuccess: bothLists,
  })

  const deleteContent = useMutation({
    mutationFn: (item: ModeratedItem) => api.deleteContent(item),
    onSuccess: bothLists,
  })

  const changeReportStatus = useMutation({
    mutationFn: ({ report, status }: { report: ReportItem; status: ReportStatus }) =>
      api.updateReportStatus(report, status),
    onSuccess: bothLists,
  })

  const withdrawReport = useMutation({
    mutationFn: (report: ReportItem) => api.deleteReport(report),
    onSuccess: () => invalidate([moderationKeys.reports(resource)]),
  })

  const failure =
    editContent.error ??
    deleteContent.error ??
    changeReportStatus.error ??
    withdrawReport.error

  const messageFor = () => {
    if (editContent.error) return getErrorMessage(editContent.error, 'The change could not be saved.')
    if (deleteContent.error)
      return getErrorMessage(deleteContent.error, 'The content could not be deleted.')
    if (changeReportStatus.error)
      return getErrorMessage(
        changeReportStatus.error,
        'Failed to update the report. The change was not saved.',
      )
    return getErrorMessage(withdrawReport.error, 'The report could not be withdrawn.')
  }

  return {
    mutating:
      editContent.isPending ||
      deleteContent.isPending ||
      changeReportStatus.isPending ||
      withdrawReport.isPending,
    actionError: failure ? messageFor() : '',
    // The response body carries nothing the screen needs — the lists are re-read — so these
    // resolve to nothing, and a caller can still await them to know the write landed.
    editContent: async (item: ModeratedItem, update: ContentUpdate) => {
      await editContent.mutateAsync({ item, update })
    },
    deleteContent: async (item: ModeratedItem) => {
      await deleteContent.mutateAsync(item)
    },
    /**
     * Fire-and-forget: the status select is driven by the reloaded list, so a refusal needs
     * no rollback — the select simply keeps showing what the backend still holds.
     */
    changeReportStatus: (report: ReportItem, status: ReportStatus) => {
      changeReportStatus.mutate({ report, status })
    },
    withdrawReport: async (report: ReportItem) => {
      await withdrawReport.mutateAsync(report)
    },
  }
}
