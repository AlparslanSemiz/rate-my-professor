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

  async getReported(): Promise<ReportedAnswer[]> {
    const response = await this.client.get<ReportedAnswersResponse>('/answers/reported')
    return expectArray<ReportedAnswer>(response, 'answers', 'GET /answers/reported')
  }

  updateStatus(id: string, status: AnswerReportStatus): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/answers/reported/${id}`, { status })
  }

  deleteReport(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/answers/reported/${id}`)
  }
}
