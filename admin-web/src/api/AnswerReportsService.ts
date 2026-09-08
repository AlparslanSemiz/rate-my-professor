import { expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import type { AnswerReportStatus, ReportedAnswer } from './answerTypes'

interface ReportedAnswersResponse extends BasicResponse {
  answers: ReportedAnswer[]
}

export class AnswerReportsService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  /** Reports against answers, addressed separately from the answers themselves. */
  async getReported(): Promise<ReportedAnswer[]> {
    const response = await this.client.get<ReportedAnswersResponse>('/answers/reported')
    return expectArray<ReportedAnswer>(response, 'answers', 'GET /answers/reported')
  }

  /** `ACTION_TAKEN` hides the answer; any other status puts it back. */
  updateStatus(id: string, status: AnswerReportStatus): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/answers/reported/${id}`, { status })
  }

  /** Withdraws the report. The answer itself is left as it is. */
  deleteReport(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/answers/reported/${id}`)
  }
}
