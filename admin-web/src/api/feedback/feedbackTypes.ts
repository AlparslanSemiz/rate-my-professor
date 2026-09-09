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

export interface GitlabIssueResponse {
  message: string
  success: boolean
  issueUrl: string | null
  issueIid: number | null
  issueState: IssueState
}
