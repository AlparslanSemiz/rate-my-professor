import type {
  CommentReportStatus,
  ReportedComment,
  ReportReason,
} from '../../api/CommentsService'
import {
  REPORT_REASONS,
  REPORT_STATUSES,
  isReportReason,
  isReportStatus,
} from '../../domain/moderation'
import { enumLabel } from '../../utils/enumLabel'

export const ALL_FILTERS = 'All'

export type StatusFilter = typeof ALL_FILTERS | CommentReportStatus
export type ReasonFilter = typeof ALL_FILTERS | ReportReason

export const statusSelectOptions = REPORT_STATUSES.map((status) => ({
  value: status,
  label: enumLabel(status),
}))

const reasonSelectOptions = REPORT_REASONS.map((reason) => ({
  value: reason,
  label: enumLabel(reason),
}))

export const statusFilterOptions = [
  { value: ALL_FILTERS, label: ALL_FILTERS },
  ...statusSelectOptions,
]
export const reasonFilterOptions = [
  { value: ALL_FILTERS, label: ALL_FILTERS },
  ...reasonSelectOptions,
]

export function toStatusFilter(value: string | null): StatusFilter {
  return value === ALL_FILTERS || isReportStatus(value) ? value : ALL_FILTERS
}

export function toReasonFilter(value: string | null): ReasonFilter {
  return value === ALL_FILTERS || isReportReason(value) ? value : ALL_FILTERS
}

export function matchesCommentQuery(report: ReportedComment, query: string) {
  return (
    report.commentContent.toLowerCase().includes(query) ||
    report.reportedUser.name.toLowerCase().includes(query) ||
    report.reporter.name.toLowerCase().includes(query) ||
    report.reportText.toLowerCase().includes(query)
  )
}

export function matchesCommentFilters(
  report: ReportedComment,
  status: StatusFilter,
  reason: ReasonFilter,
) {
  return (
    (status === ALL_FILTERS || report.status === status) &&
    (reason === ALL_FILTERS || report.reason === reason)
  )
}
