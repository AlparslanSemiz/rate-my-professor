import { apiClient, type ApiClient, type BasicResponse } from '@/api/client/ApiClient'
import { BugReportsService } from './BugReportsService'
import { GitlabIssueService } from './GitlabIssueService'
import type { BugReport, BugReportUpdate, GitlabIssueResponse } from './feedbackTypes'

export type {
  BugReport,
  BugReportUpdate,
  GitlabIssueResponse,
  IssueState,
  ReportStatus,
  Severity,
} from './feedbackTypes'

export class FeedbackService {
  private readonly bugReports: BugReportsService
  private readonly gitlabIssues: GitlabIssueService

  constructor(client: ApiClient) {
    this.bugReports = new BugReportsService(client)
    this.gitlabIssues = new GitlabIssueService(client)
  }

  async getReports(): Promise<BugReport[]> {
    return this.bugReports.getReports()
  }

  updateReport(id: string, update: BugReportUpdate): Promise<BasicResponse> {
    return this.bugReports.updateReport(id, update)
  }

  deleteReport(id: string): Promise<BasicResponse> {
    return this.bugReports.deleteReport(id)
  }

  createGitlabIssue(id: string): Promise<GitlabIssueResponse> {
    return this.gitlabIssues.createIssue(id)
  }
}

export const feedbackService = new FeedbackService(apiClient)
