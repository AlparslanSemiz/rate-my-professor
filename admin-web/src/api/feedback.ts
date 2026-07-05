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
  return [...MOCK_REPORTS]
}

export async function updateReportStatus(id: number, status: ReportStatus): Promise<void> {
  await new Promise((r) => setTimeout(r, 300))

  const report = MOCK_REPORTS.find((item) => item.id === id)
  if (!report) throw new Error(`Report with id ${id} not found`)

  report.status = status
}
