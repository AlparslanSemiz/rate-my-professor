import { expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import type { BugReport, BugReportUpdate } from './feedbackTypes'

interface BugReportsResponse extends BasicResponse {
  bugReports: BugReport[]
}

export class BugReportsService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getReports(): Promise<BugReport[]> {
    const response = await this.client.get<BugReportsResponse>('/reports')
    return expectArray<BugReport>(response, 'bugReports', 'GET /reports')
  }

  updateReport(id: string, update: BugReportUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/reports/${id}`, update)
  }

  deleteReport(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/reports/${id}`)
  }
}
