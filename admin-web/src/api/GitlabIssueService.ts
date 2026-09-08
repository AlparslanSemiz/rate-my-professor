import type { ApiClient } from './ApiClient'
import type { GitlabIssueResponse } from './feedbackTypes'

export class GitlabIssueService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  createIssue(reportId: string): Promise<GitlabIssueResponse> {
    return this.client.post<GitlabIssueResponse>(`/reports/${reportId}/gitlab-issue`)
  }
}
