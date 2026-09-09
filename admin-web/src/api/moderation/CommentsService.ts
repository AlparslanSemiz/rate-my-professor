import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
import { CommentContentService } from './CommentContentService'
import { CommentReportsService } from './CommentReportsService'
import type { ContentUpdate } from './contentTypes'
import type { CommentReportStatus, ManagedComment, ReportedComment } from './commentTypes'

export type { ContentUpdate } from './contentTypes'
export type {
  CommentReportStatus,
  CommentUserRef,
  ManagedComment,
  ReportedComment,
  ReportReason,
  UserRole,
  UserStatus,
} from './commentTypes'

export class CommentsService {
  private readonly content: CommentContentService
  private readonly reports: CommentReportsService

  constructor(client: ApiClient) {
    this.content = new CommentContentService(client)
    this.reports = new CommentReportsService(client)
  }

  async getAll(): Promise<ManagedComment[]> {
    return this.content.getAll()
  }

  async getReported(): Promise<ReportedComment[]> {
    return this.reports.getReported()
  }

  update(id: string, update: ContentUpdate): Promise<BasicResponse> {
    return this.content.update(id, update)
  }

  delete(id: string): Promise<BasicResponse> {
    return this.content.delete(id)
  }

  updateStatus(id: string, status: CommentReportStatus): Promise<BasicResponse> {
    return this.reports.updateStatus(id, status)
  }

  deleteReport(id: string): Promise<BasicResponse> {
    return this.reports.deleteReport(id)
  }
}

export const commentsService = new CommentsService(apiClient)
