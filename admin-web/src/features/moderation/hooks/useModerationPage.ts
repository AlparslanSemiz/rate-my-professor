import { useCallback, useMemo, useState } from 'react'
import type { ContentUpdate } from '../../../api/CommentsService'
import type { BasicResponse } from '../../../api/ApiClient'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useSearch } from '../../../hooks/useSearch'
import { useSelectedId } from '../../../hooks/useSelectedId'
import type { ReportStatus } from '../../../domain/moderation'
import { getErrorMessage } from '../../../utils/getErrorMessage'
import {
  ALL_FILTERS,
  matchesContentFilters,
  matchesContentQuery,
  matchesReportFilters,
  matchesReportQuery,
  type ContentStatusFilter,
  type ModeratedItem,
  type ReasonFilter,
  type ReportItem,
  type StatusFilter,
} from '../moderationModel'

/**
 * The half-dozen calls a moderation page makes. Comments and answers expose the same
 * operations under different paths, so the page supplies them and everything else is shared.
 * Every function is expected to be defined at module scope, the way `useAsyncData` is used
 * elsewhere, so the initial load runs once.
 */
export interface ModerationApi {
  loadContent: () => Promise<ModeratedItem[]>
  loadReports: () => Promise<ReportItem[]>
  updateContent: (item: ModeratedItem, update: ContentUpdate) => Promise<BasicResponse>
  deleteContent: (item: ModeratedItem) => Promise<BasicResponse>
  updateReportStatus: (report: ReportItem, status: ReportStatus) => Promise<BasicResponse>
  deleteReport: (report: ReportItem) => Promise<BasicResponse>
}

const EMPTY_CONTENT: ModeratedItem[] = []
const EMPTY_REPORTS: ReportItem[] = []

interface ModerationPageOptions {
  api: ModerationApi
  contentErrorMessage: string
  reportsErrorMessage: string
}

export function useModerationPage({
  api,
  contentErrorMessage,
  reportsErrorMessage,
}: ModerationPageOptions) {
  const content = useAsyncData(api.loadContent, EMPTY_CONTENT, contentErrorMessage)
  const reports = useAsyncData(api.loadReports, EMPTY_REPORTS, reportsErrorMessage)

  const [contentStatusFilter, setContentStatusFilter] = useState<ContentStatusFilter>(ALL_FILTERS)
  const [reportStatusFilter, setReportStatusFilter] = useState<StatusFilter>(ALL_FILTERS)
  const [reportReasonFilter, setReportReasonFilter] = useState<ReasonFilter>(ALL_FILTERS)
  const [mutating, setMutating] = useState(false)
  const [actionError, setActionError] = useState('')

  const profile = useSelectedId()
  const contentSearch = useSearch(content.data, matchesContentQuery)
  const reportSearch = useSearch(reports.data, matchesReportQuery)

  const filteredContent = useMemo(
    () => contentSearch.filtered.filter((item) => matchesContentFilters(item, contentStatusFilter)),
    [contentSearch.filtered, contentStatusFilter],
  )

  const filteredReports = useMemo(
    () =>
      reportSearch.filtered.filter((report) =>
        matchesReportFilters(report, reportStatusFilter, reportReasonFilter),
      ),
    [reportSearch.filtered, reportStatusFilter, reportReasonFilter],
  )

  const setContentData = content.setData
  const setReportsData = reports.setData

  const refreshContent = useCallback(async () => {
    setContentData(await api.loadContent())
  }, [api, setContentData])

  const refreshReports = useCallback(async () => {
    setReportsData(await api.loadReports())
  }, [api, setReportsData])

  /**
   * Runs a mutation and reloads what it can have changed. The lists are refetched rather than
   * patched in place because the backend couples them: resolving a report as `ACTION_TAKEN`
   * hides the content, and deleting a comment takes its reports with it.
   */
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
    (report: ReportItem, status: ReportStatus) =>
      run(
        () => api.updateReportStatus(report, status),
        refreshBoth,
        'Failed to update the report. The change was not saved.',
      ).catch(() => {
        // The status select is driven by the reloaded list, so a failure needs no rollback.
      }),
    [api, refreshBoth, run],
  )

  const withdrawReport = useCallback(
    (report: ReportItem) =>
      run(() => api.deleteReport(report), refreshReports, 'The report could not be withdrawn.'),
    [api, refreshReports, run],
  )

  return {
    content: content.data,
    reports: reports.data,
    filteredContent,
    filteredReports,
    loading: content.loading || reports.loading,
    loadError: content.error || reports.error,
    retry: () => {
      content.retry()
      reports.retry()
    },
    contentSearch: contentSearch.search,
    setContentSearch: contentSearch.setSearch,
    reportSearch: reportSearch.search,
    setReportSearch: reportSearch.setSearch,
    contentStatusFilter,
    setContentStatusFilter,
    reportStatusFilter,
    setReportStatusFilter,
    reportReasonFilter,
    setReportReasonFilter,
    mutating,
    actionError,
    profile,
    editContent,
    deleteContent,
    changeReportStatus,
    withdrawReport,
  }
}
