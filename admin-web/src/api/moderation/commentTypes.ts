import type { ContentStatus, ReportReason, ReportStatus } from '@/domain/moderation'
import type { UserReference, UserRole, UserStatus } from '@/domain/user'

/** A comment report's status. The same vocabulary every report uses. */
export type CommentReportStatus = ReportStatus
/** How a comment names its author. The same reference every screen renders as a chip. */
export type CommentUserRef = UserReference
export type { ReportReason, UserRole, UserStatus }

/**
 * A comment as the panel manages it — every comment, not only the reported ones. `status` is
 * the visibility the student app reads; hidden content is filtered out of its read path.
 */
export interface ManagedComment {
  id: string
  content: string
  status: ContentStatus
  author: UserReference
  postContext: string
  lectureId: string
  answers: number
  reports: number
  createdAt: string
}

/**
 * A report raised against a comment.
 *
 * Carries **two** ids and they address different things: `id` is the report, `commentId` is
 * the comment. Withdrawing a report and hiding a comment are separate endpoints, and using
 * the wrong id here moderates the wrong record.
 */
export interface ReportedComment {
  /** The report's id — what the status and withdrawal routes address. */
  id: string
  /** The reported comment's own id, which is what moderating the content addresses. */
  commentId: string
  commentContent: string
  postContext: string
  reportText: string
  reportedUser: UserReference
  reporter: UserReference
  reason: ReportReason
  status: CommentReportStatus
  date: string
}
