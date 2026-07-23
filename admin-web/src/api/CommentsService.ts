import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
import type { UserRole, UserStatus } from './UsersService'
import type { ReportReason, ReportStatus } from '../domain/moderation'

export type CommentReportStatus = ReportStatus
export type { ReportReason }

export interface CommentUserRef {
  id: string
  name: string
  role: UserRole
  warnings: number
  status: UserStatus
}

export interface ReportedComment {
  id: string
  commentContent: string
  postContext: string
  reportText: string
  reportedUser: CommentUserRef
  reporter: CommentUserRef
  reason: ReportReason
  status: CommentReportStatus
  date: string
}

interface ReportedCommentsResponse extends BasicResponse {
  comments: ReportedComment[]
}

export class CommentsService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getReported(): Promise<ReportedComment[]> {
    const response = await this.client.get<ReportedCommentsResponse>('/comments/reported')
    return response.comments
  }

  updateStatus(id: string, status: CommentReportStatus): Promise<BasicResponse> {
    return this.client.patch(`/comments/reported/${id}`, { status })
  }
}

export const commentsService = new CommentsService(apiClient)
