import { apiClient, type ApiClient } from './ApiClient'

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

interface BasicResponse {
  message: string
  success: boolean
}

interface BugReportsResponse extends BasicResponse {
  bugReports: BugReport[]
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

  updateStatus(id: string, status: ReportStatus): Promise<BasicResponse> {
    return this.client.withQueryParams('PATCH', `/reports/${id}`, { status })
  }
}

export const feedbackService = new FeedbackService(apiClient)
