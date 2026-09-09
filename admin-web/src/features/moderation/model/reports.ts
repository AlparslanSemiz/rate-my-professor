import { type ReportedAnswer, type ReportedComment } from '@/api/moderation'
import type { ReportReason, ReportStatus } from '@/domain/moderation'
import type { UserReference } from '@/domain/user'
import { ALL_FILTERS, type ReasonFilter, type StatusFilter } from './filterOptions'

/** A report against a comment or an answer, flattened the same way. */
export interface ReportItem {
  /** The report's id. Addresses the report itself — its status, and withdrawing it. */
  id: string
  kind: 'comment' | 'answer'
  /** The id of the content the report is about. A different address from `id`. */
  contentId: string
  content: string
  /** The parent comment of a reported answer; absent for a reported comment. */
  parentContent: string | null
  postContext: string
  reportText: string
  reportedUser: UserReference
  reporter: UserReference
  reason: ReportReason
  status: ReportStatus
  date: string
}

/**
 * @param report a comment report as the backend sends it
 * @returns it flattened to the shape both report tables render
 */
export function toCommentReport(report: ReportedComment): ReportItem {
  return {
    id: report.id,
    kind: 'comment',
    contentId: report.commentId,
    content: report.commentContent,
    parentContent: null,
    postContext: report.postContext,
    reportText: report.reportText,
    reportedUser: report.reportedUser,
    reporter: report.reporter,
    reason: report.reason,
    status: report.status,
    date: report.date,
  }
}

/**
 * @param report an answer report as the backend sends it
 * @returns it flattened to the shape both report tables render
 */
export function toAnswerReport(report: ReportedAnswer): ReportItem {
  return {
    id: report.id,
    kind: 'answer',
    contentId: report.answerId,
    content: report.answerContent,
    parentContent: report.commentContent,
    postContext: report.postContext,
    reportText: report.reportText,
    reportedUser: report.reportedUser,
    reporter: report.reporter,
    reason: report.reason,
    status: report.status,
    date: report.date,
  }
}

/**
 * @param report the row to test
 * @param query the search text, already trimmed and lower-cased
 * @returns whether the content, the reporter or the reported user matches
 */
export function matchesReportQuery(report: ReportItem, query: string) {
  return (
    report.content.toLowerCase().includes(query) ||
    report.reportedUser.name.toLowerCase().includes(query) ||
    report.reporter.name.toLowerCase().includes(query) ||
    report.reportText.toLowerCase().includes(query)
  )
}

/**
 * @param report the row to test
 * @param status the status filter, or `ALL_FILTERS`
 * @param reason the reason filter, or `ALL_FILTERS`
 * @returns whether the row survives both filters
 */
export function matchesReportFilters(
  report: ReportItem,
  status: StatusFilter,
  reason: ReasonFilter,
) {
  return (
    (status === ALL_FILTERS || report.status === status) &&
    (reason === ALL_FILTERS || report.reason === reason)
  )
}
