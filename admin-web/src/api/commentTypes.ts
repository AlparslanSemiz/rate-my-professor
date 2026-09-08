import type { ContentStatus, ReportReason, ReportStatus } from '../domain/moderation'
import type { UserReference, UserRole, UserStatus } from '../domain/user'

export type CommentReportStatus = ReportStatus
export type CommentUserRef = UserReference
export type { ReportReason, UserRole, UserStatus }

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
  id: string
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
