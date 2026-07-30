import type { ManagedAnswer, ReportedAnswer } from '../../api/AnswersService'
import type { ManagedComment, ReportedComment } from '../../api/CommentsService'
import type { UserReference } from '../../domain/user'
import {
  CONTENT_STATUSES,
  REPORT_REASONS,
  REPORT_STATUSES,
  isContentStatus,
  isReportReason,
  isReportStatus,
  type ContentStatus,
  type ReportReason,
  type ReportStatus,
} from '../../domain/moderation'
import { enumLabel } from '../../utils/enumLabel'

export const ALL_FILTERS = 'All'

export type StatusFilter = typeof ALL_FILTERS | ReportStatus
export type ReasonFilter = typeof ALL_FILTERS | ReportReason
export type ContentStatusFilter = typeof ALL_FILTERS | ContentStatus

/**
 * A comment or an answer, flattened to what the moderation table renders. Both endpoints
 * return the same fields under different names, and the extra one each carries — the answer
 * count of a comment, the parent thread of an answer — reads as one secondary line.
 *
 * `kind` tells the page which service a mutation on this item belongs to. `replies` is only
 * populated on a comment: the answers nested under it in the table, fetched and attached by
 * the comments page itself.
 */
export interface ModeratedItem {
  id: string
  kind: 'comment' | 'answer'
  content: string
  status: ContentStatus
  author: UserReference
  postContext: string
  /** Second line under the lecture: the thread for an answer, the reply count for a comment. */
  detail: string
  reports: number
  createdAt: string
  replies?: ModeratedItem[]
}

/** A report against a comment or an answer, flattened the same way. */
export interface ReportItem {
  id: string
  kind: 'comment' | 'answer'
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

export function toModeratedComment(comment: ManagedComment): ModeratedItem {
  return {
    id: comment.id,
    kind: 'comment',
    content: comment.content,
    status: comment.status,
    author: comment.author,
    postContext: comment.postContext,
    detail: `${comment.answers} answer${comment.answers === 1 ? '' : 's'}`,
    reports: comment.reports,
    createdAt: comment.createdAt,
  }
}

export function toModeratedAnswer(answer: ManagedAnswer): ModeratedItem {
  return {
    id: answer.id,
    kind: 'answer',
    content: answer.content,
    status: answer.status,
    author: answer.author,
    postContext: answer.postContext,
    detail: `Re: ${answer.commentPreview}`,
    reports: answer.reports,
    createdAt: answer.createdAt,
  }
}

/** Nests each answer under its parent comment so the table can show it as an expandable reply. */
export function attachReplies(comments: ManagedComment[], answers: ManagedAnswer[]): ModeratedItem[] {
  const repliesByComment = new Map<string, ModeratedItem[]>()
  for (const answer of answers) {
    const replies = repliesByComment.get(answer.commentId) ?? []
    replies.push(toModeratedAnswer(answer))
    repliesByComment.set(answer.commentId, replies)
  }

  return comments.map((comment) => ({
    ...toModeratedComment(comment),
    replies: repliesByComment.get(comment.id) ?? [],
  }))
}

export function toCommentReport(report: ReportedComment): ReportItem {
  return {
    id: report.id,
    kind: 'comment',
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

export function toAnswerReport(report: ReportedAnswer): ReportItem {
  return {
    id: report.id,
    kind: 'answer',
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

export const reportStatusSelectOptions = REPORT_STATUSES.map((status) => ({
  value: status,
  label: enumLabel(status),
}))

const reasonSelectOptions = REPORT_REASONS.map((reason) => ({
  value: reason,
  label: enumLabel(reason),
}))

const allOption = { value: ALL_FILTERS, label: ALL_FILTERS }

export const reportStatusFilterOptions = [allOption, ...reportStatusSelectOptions]
export const reasonFilterOptions = [allOption, ...reasonSelectOptions]
export const contentStatusFilterOptions = [
  allOption,
  ...CONTENT_STATUSES.map((status) => ({ value: status, label: enumLabel(status) })),
]

export function toStatusFilter(value: string | null): StatusFilter {
  return value === ALL_FILTERS || isReportStatus(value) ? value : ALL_FILTERS
}

export function toReasonFilter(value: string | null): ReasonFilter {
  return value === ALL_FILTERS || isReportReason(value) ? value : ALL_FILTERS
}

export function toContentStatusFilter(value: string | null): ContentStatusFilter {
  return value === ALL_FILTERS || isContentStatus(value) ? value : ALL_FILTERS
}

export function matchesReportQuery(report: ReportItem, query: string) {
  return (
    report.content.toLowerCase().includes(query) ||
    report.reportedUser.name.toLowerCase().includes(query) ||
    report.reporter.name.toLowerCase().includes(query) ||
    report.reportText.toLowerCase().includes(query)
  )
}

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

export function matchesContentQuery(item: ModeratedItem, query: string) {
  return (
    item.content.toLowerCase().includes(query) ||
    item.author.name.toLowerCase().includes(query) ||
    item.postContext.toLowerCase().includes(query)
  )
}

export function matchesContentFilters(item: ModeratedItem, status: ContentStatusFilter) {
  return status === ALL_FILTERS || item.status === status
}
