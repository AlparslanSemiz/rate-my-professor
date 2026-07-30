import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
import type { UserReference, UserRole, UserStatus } from '../domain/user'
import type {
  ContentStatus,
  EditableContentStatus,
  ReportReason,
  ReportStatus,
} from '../domain/moderation'

export type CommentReportStatus = ReportStatus
export type { ReportReason }
export type CommentUserRef = UserReference
export type { UserRole, UserStatus }

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
  id: string
  commentContent: string
  postContext: string
  reportText: string
  reportedUser: UserReference
  reporter: UserReference
  reason: ReportReason
  status: CommentReportStatus
  date: string
}

/** Partial edit of a comment. An omitted field is left alone; at least one has to be supplied. */
export interface ContentUpdate {
  content?: string
  status?: EditableContentStatus
}

interface ManagedCommentsResponse extends BasicResponse {
  comments: ManagedComment[]
}

interface ReportedCommentsResponse extends BasicResponse {
  comments: ReportedComment[]
}

export class CommentsService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getAll(): Promise<ManagedComment[]> {
    const response = await this.client.get<ManagedCommentsResponse>('/comments')
    return response.comments
  }

  async getReported(): Promise<ReportedComment[]> {
    const response = await this.client.get<ReportedCommentsResponse>('/comments/reported')
    return response.comments
  }

  /** Edits the text or the visibility of a comment, independently of any report. */
  update(id: string, update: ContentUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/comments/${id}`, update)
  }

  /** Removes the comment and the thread under it. This is a real delete, not a hide. */
  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/comments/${id}`)
  }

  /**
   * `ACTION_TAKEN` is the status that means the content was moderated, so it hides the
   * comment; moving the report to any other status puts the comment back.
   */
  updateStatus(id: string, status: CommentReportStatus): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/comments/reported/${id}`, { status })
  }

  /** Withdraws the report. The comment itself is left as it is. */
  deleteReport(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/comments/reported/${id}`)
  }
}

export const commentsService = new CommentsService(apiClient)
