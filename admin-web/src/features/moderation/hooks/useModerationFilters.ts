import { useMemo, useState } from 'react'
import { useSearch } from '../../../hooks/useSearch'
import {
  ALL_FILTERS,
  matchesReportFilters,
  matchesReportQuery,
  narrowContent,
  type ContentStatusFilter,
  type ModeratedItem,
  type ReasonFilter,
  type ReportItem,
  type StatusFilter,
} from '../moderationModel'

export function useModerationFilters(content: ModeratedItem[], reports: ReportItem[]) {
  const [contentStatusFilter, setContentStatusFilter] = useState<ContentStatusFilter>(ALL_FILTERS)
  const [reportStatusFilter, setReportStatusFilter] = useState<StatusFilter>(ALL_FILTERS)
  const [reportReasonFilter, setReportReasonFilter] = useState<ReasonFilter>(ALL_FILTERS)
  const [contentSearch, setContentSearch] = useState('')
  const reportSearch = useSearch(reports, matchesReportQuery)

  const filteredContent = useMemo(
    () => narrowContent(content, contentSearch, contentStatusFilter),
    [content, contentSearch, contentStatusFilter],
  )

  const filteredReports = useMemo(
    () =>
      reportSearch.filtered.filter((report) =>
        matchesReportFilters(report, reportStatusFilter, reportReasonFilter),
      ),
    [reportSearch.filtered, reportStatusFilter, reportReasonFilter],
  )

  return {
    filteredContent,
    filteredReports,
    contentSearch,
    setContentSearch,
    contentNarrowed: contentSearch.trim() !== '' || contentStatusFilter !== ALL_FILTERS,
    reportSearch: reportSearch.search,
    setReportSearch: reportSearch.setSearch,
    contentStatusFilter,
    setContentStatusFilter,
    reportStatusFilter,
    setReportStatusFilter,
    reportReasonFilter,
    setReportReasonFilter,
  }
}
