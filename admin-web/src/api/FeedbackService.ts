import { apiClient, expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import type { ReportStatus, Severity } from '../domain/moderation'

export type { ReportStatus, Severity }

/** Whether a GitLab issue has been opened for a report, and how that went. */
export type IssueState = 'NONE' | 'CREATED' | 'FAILED'

export interface BugReport {
  id: string
  title: string
  description: string
  severity: Severity
  status: ReportStatus
  reporterName: string
  reportedAt: string
  /** The issue on the board, once one exists. */
  issueUrl: string | null
  issueState: IssueState
}

interface GitlabIssueResponse extends BasicResponse {
  issueUrl: string | null
  issueIid: number | null
  issueState: IssueState
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
    return expectArray<BugReport>(response, 'bugReports', 'GET /reports')
  }

  updateReport(id: string, update: BugReportUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/reports/${id}`, update)
  }

  deleteReport(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/reports/${id}`)
  }

  /**
   * Opens an issue on the GitLab board for this report. Idempotent: a second press, two
   * admins on the same queue, or a retry after a timeout all get the existing issue back.
   *
   * Answers `503` while the backend holds no GitLab credentials, which is why the control is
   * hidden on `/system/status`'s `gitlabEnabled` rather than discovered by pressing it.
   */
  createGitlabIssue(id: string): Promise<GitlabIssueResponse> {
    return this.client.post<GitlabIssueResponse>(`/reports/${id}/gitlab-issue`)
  }
}

export const feedbackService = new FeedbackService(apiClient)
