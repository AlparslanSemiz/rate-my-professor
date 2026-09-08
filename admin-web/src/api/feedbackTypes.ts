import type { ReportStatus, Severity } from '../domain/moderation'

export type { ReportStatus, Severity }

export type IssueState = 'NONE' | 'CREATED' | 'FAILED'

export interface BugReport {
  id: string
  title: string
  description: string
  severity: Severity
  status: ReportStatus
  reporterName: string
  reportedAt: string
  issueUrl: string | null
  issueState: IssueState
}

export interface BugReportUpdate {
  status?: ReportStatus
  severity?: Severity
  title?: string
  description?: string
}

export interface GitlabIssueResponse {
  message: string
  success: boolean
  issueUrl: string | null
  issueIid: number | null
  issueState: IssueState
}
