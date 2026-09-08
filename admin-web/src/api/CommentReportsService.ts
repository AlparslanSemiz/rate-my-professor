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

  /** Reports against comments, addressed separately from the comments themselves. */
  async getReported(): Promise<ReportedComment[]> {
    const response = await this.client.get<ReportedCommentsResponse>('/comments/reported')
    return expectArray<ReportedComment>(response, 'comments', 'GET /comments/reported')
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
