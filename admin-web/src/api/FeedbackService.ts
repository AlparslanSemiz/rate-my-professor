import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
import type { ReportStatus, Severity } from '../domain/moderation'

export type { ReportStatus, Severity }

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

/**
 * Partial edit of a bug report. An omitted field is left alone and at least one has to be
 * supplied. `title` and `description` are editable so a report filed with a useless title can
 * be made findable.
 */
export interface BugReportUpdate {
  status?: ReportStatus
  severity?: Severity
  title?: string
  description?: string
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
    return this.client.patch<BasicResponse>(`/reports/${id}`, update)
  }

  deleteReport(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/reports/${id}`)
  }
}

export const feedbackService = new FeedbackService(apiClient)
