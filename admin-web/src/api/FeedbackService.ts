import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type ReportStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN'

export interface BugReport {
  id: string
  title: string
  description: string
  severity: Severity
  status: ReportStatus
  reporterName: string
  reportedAt: string
}

interface BugReportsResponse extends BasicResponse {
  bugReports: BugReport[]
}

export interface BugReportUpdate {
  status?: ReportStatus
  severity?: Severity
}

export class FeedbackService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getReports(): Promise<BugReport[]> {
    const response = await this.client.get<BugReportsResponse>('/reports')
    return response.bugReports
  }

  updateReport(id: string, update: BugReportUpdate): Promise<BasicResponse> {
    return this.client.patch(`/reports/${id}`, update)
  }
}

export const feedbackService = new FeedbackService(apiClient)
