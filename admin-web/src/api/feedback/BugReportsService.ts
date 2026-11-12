import { expectArray, type BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { BugReport, BugReportUpdate } from './feedbackTypes'

interface BugReportsResponse extends BasicResponse {
  bugReports: BugReport[]
}

/** Reading, editing and deleting the bug reports students filed. */
export class BugReportsService extends HttpService {
  /** Reads technical bug reports filed from the app. */
  async getReports(): Promise<BugReport[]> {
    const response = await this.client.get<BugReportsResponse>('/reports')
    return expectArray<BugReport>(response, 'bugReports', 'GET /reports')
  }

  /** Updates report triage fields or makes title/description corrections. */
  updateReport(id: string, update: BugReportUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/reports/${id}`, update)
  }

  /**
   * @param id the report to delete
   * @returns the envelope
   */
  deleteReport(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/reports/${id}`)
  }
}
