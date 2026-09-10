import { apiClient, type HttpTransport, type BasicResponse } from '@/api/client/ApiClient'
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

/**
 * Bug reports students filed, and the optional GitLab issue a report can be escalated into.
 *
 * The GitLab half is its own service because it is the one part of the panel that may not be
 * configured at all: with any of the integration's variables unset the backend reports
 * `gitlabEnabled: false` and answers the endpoint `503`.
 */
export class FeedbackService {
  private readonly bugReports: BugReportsService
  private readonly gitlabIssues: GitlabIssueService

  constructor(client: HttpTransport) {
    this.bugReports = new BugReportsService(client)
    this.gitlabIssues = new GitlabIssueService(client)
  }

  /**
   * @returns every bug report, unpaged, with the GitLab flag that decides whether the
   *          escalation control is offered at all
   * @throws {ContractError} when the response holds no `bugReports` list
   */
  async getReports(): Promise<BugReport[]> {
    return this.bugReports.getReports()
  }

  /**
   * Applies a partial edit — triage fields, or a correction to the title or description.
   *
   * @param id the report to edit
   * @param update only the fields that changed; an empty body is refused
   * @returns the envelope
   */
  updateReport(id: string, update: BugReportUpdate): Promise<BasicResponse> {
    return this.bugReports.updateReport(id, update)
  }

  /**
   * @param id the report to delete
   * @returns the envelope
   */
  deleteReport(id: string): Promise<BasicResponse> {
    return this.bugReports.deleteReport(id)
  }

  /**
   * Escalates a report into a GitLab issue and records the link on the report.
   *
   * @param id the report to escalate
   * @returns the created issue, whose URL is then shown on the report
   * @throws {ResponseError} `503` when the integration is not configured — which is why the
   *         control is hidden unless `gitlabEnabled` said otherwise
   */
  createGitlabIssue(id: string): Promise<GitlabIssueResponse> {
    return this.gitlabIssues.createIssue(id)
  }
}

/** The panel's feedback service, bound to the shared client. */
export const feedbackService = new FeedbackService(apiClient)
