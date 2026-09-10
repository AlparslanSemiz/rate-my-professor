import { HttpService } from '@/api/client/HttpService'
import type { GitlabIssueResponse } from './feedbackTypes'

/** Escalating a bug report into a GitLab issue. Unreachable unless the backend is configured. */
export class GitlabIssueService extends HttpService {
  /**
   * Opens an issue on the GitLab board for this report. Idempotent: a second press, two
   * admins on the same queue, or a retry after a timeout all get the existing issue back.
   */
  createIssue(reportId: string): Promise<GitlabIssueResponse> {
    return this.client.post<GitlabIssueResponse>(`/reports/${reportId}/gitlab-issue`)
  }
}
