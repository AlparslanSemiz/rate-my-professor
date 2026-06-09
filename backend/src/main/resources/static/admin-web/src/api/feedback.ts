export type Severity = 'Low' | 'Medium' | 'High' | 'Critical'
export type ReportStatus = 'Open' | 'In Progress' | 'Resolved'

export interface BugReport {
  id: number
  title: string
  description: string
  severity: Severity
  status: ReportStatus
  reportedBy: string
  reportedAt: string
}

const MOCK_REPORTS: BugReport[] = []

export async function getReports(): Promise<BugReport[]> {
  await new Promise((r) => setTimeout(r, 400))
  return MOCK_REPORTS
}

export async function updateReportStatus(_id: number, _status: ReportStatus): Promise<void> {
  await new Promise((r) => setTimeout(r, 300))
}
