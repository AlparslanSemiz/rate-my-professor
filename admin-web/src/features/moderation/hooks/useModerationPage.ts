import { useCallback } from 'react'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { useSelectedId } from '../../../hooks/useSelectedId'
import {
  findContent,
  type ModeratedItem,
  type ReportItem,
} from '../moderationModel'
import type { ModerationApi } from './moderationApi'
import { useModerationFilters } from './useModerationFilters'
import { useModerationMutations } from './useModerationMutations'

export type { ModerationApi } from './moderationApi'

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

  const profile = useSelectedId()
  const filters = useModerationFilters(content.data, reports.data)

  const setContentData = content.setData
  const setReportsData = reports.setData

  const refreshContent = useCallback(async () => {
    setContentData(await api.loadContent())
  }, [api, setContentData])

  const refreshReports = useCallback(async () => {
    setReportsData(await api.loadReports())
  }, [api, setReportsData])

  const actions = useModerationMutations({ api, refreshContent, refreshReports })

  /**
   * The content a report is about. Both lists are already loaded, so the reports tab can act
   * on the real comment — with its real visibility — instead of on a guess assembled from
   * the report.
   */
  const contentFor = useCallback(
    (report: ReportItem) => findContent(content.data, { id: report.contentId, kind: report.kind }),
    [content.data],
  )

  return {
    content: content.data,
    reports: reports.data,
    filteredContent: filters.filteredContent,
    filteredReports: filters.filteredReports,
    loading: content.loading || reports.loading,
    loadError: content.error || reports.error,
    retry: () => {
      content.retry()
      reports.retry()
    },
    contentSearch: filters.contentSearch,
    setContentSearch: filters.setContentSearch,
    contentNarrowed: filters.contentNarrowed,
    reportSearch: filters.reportSearch,
    setReportSearch: filters.setReportSearch,
    contentStatusFilter: filters.contentStatusFilter,
    setContentStatusFilter: filters.setContentStatusFilter,
    reportStatusFilter: filters.reportStatusFilter,
    setReportStatusFilter: filters.setReportStatusFilter,
    reportReasonFilter: filters.reportReasonFilter,
    setReportReasonFilter: filters.setReportReasonFilter,
    mutating: actions.mutating,
    actionError: actions.actionError,
    profile,
    editContent: actions.editContent,
    deleteContent: actions.deleteContent,
    contentFor,
    changeReportStatus: actions.changeReportStatus,
    withdrawReport: actions.withdrawReport,
  }
}
