import type { ContentStatus, ReportReason, ReportStatus } from '@/domain/moderation'
import type { UserReference, UserRole, UserStatus } from '@/domain/user'

export type CommentReportStatus = ReportStatus
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
