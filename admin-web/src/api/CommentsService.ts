import { apiClient, type ApiClient } from './ApiClient'
import type { UserRole, UserStatus } from './UsersService'

export type CommentReportStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN'
export type ReportReason =
  | 'SPAM'
  | 'INSULT'
  | 'HARASSMENT'
  | 'HATE_SPEECH'
  | 'PERSONAL_INFORMATION'
  | 'OFF_TOPIC'
  | 'INAPPROPRIATE_CONTENT'
  | 'OTHER'

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

interface BasicResponse {
  message: string
  success: boolean
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
    return this.client.withQueryParams('PATCH', `/comments/reported/${id}`, { status })
  }
}

export const commentsService = new CommentsService(apiClient)
