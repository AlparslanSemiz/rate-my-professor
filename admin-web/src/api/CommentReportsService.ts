import { expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import type { CommentReportStatus, ReportedComment } from './commentTypes'

interface ReportedCommentsResponse extends BasicResponse {
  comments: ReportedComment[]
}

export class CommentReportsService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getReported(): Promise<ReportedComment[]> {
    const response = await this.client.get<ReportedCommentsResponse>('/comments/reported')
    return expectArray<ReportedComment>(response, 'comments', 'GET /comments/reported')
  }

  updateStatus(id: string, status: CommentReportStatus): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/comments/reported/${id}`, { status })
  }

  deleteReport(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/comments/reported/${id}`)
  }
}
