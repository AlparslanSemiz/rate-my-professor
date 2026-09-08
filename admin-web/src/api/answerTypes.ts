import type { ContentStatus, ReportReason, ReportStatus } from '../domain/moderation'
import type { UserReference } from '../domain/user'

export type AnswerReportStatus = ReportStatus

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

export interface ReportedAnswer {
  id: string
  answerId: string
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
