import type { ApiClient } from './ApiClient'
import type { GitlabIssueResponse } from './feedbackTypes'

export class GitlabIssueService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  /**
   * Opens an issue on the GitLab board for this report. Idempotent: a second press, two
   * admins on the same queue, or a retry after a timeout all get the existing issue back.
   */
  createIssue(reportId: string): Promise<GitlabIssueResponse> {
    return this.client.post<GitlabIssueResponse>(`/reports/${reportId}/gitlab-issue`)
  }
}
