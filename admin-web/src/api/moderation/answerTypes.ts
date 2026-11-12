import type { ContentStatus, ReportReason, ReportStatus } from '@/domain/moderation'
import type { UserReference } from '@/domain/user'

/** An answer report's status. The same vocabulary every report uses. */
export type AnswerReportStatus = ReportStatus

/**
 * An answer as the panel manages it. `commentPreview` is enough of the parent comment to
 * recognise the thread; `postContext` is the lecture it belongs to.
 */
export interface ManagedAnswer {
  id: string
  content: string
  status: ContentStatus
  author: UserReference
  commentId: string
  commentPreview: string
  postContext: string
  reports: number
  createdAt: string
}

/** A report against an answer. Mirrors a comment report, with the parent comment as context. */
export interface ReportedAnswer {
  /** The report's id — what the status and withdrawal routes address. */
  id: string
  /** The reported answer's own id, which is what moderating the content addresses. */
  answerId: string
  /** The answer's parent comment, for context rather than for moderating. */
  commentId: string
  answerContent: string
  commentContent: string
  postContext: string
  reportText: string
  reportedUser: UserReference
  reporter: UserReference
  reason: ReportReason
  status: AnswerReportStatus
  date: string
}
