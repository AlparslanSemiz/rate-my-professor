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

/** In-memory store for bug reports, used when no backend is configured. */
export class FeedbackRepository {
  private reports: BugReport[] = []

  getAll(): BugReport[] {
    return this.reports.map((report) => ({ ...report }))
  }

  setStatus(id: number, status: ReportStatus): void {
    if (!this.reports.some((report) => report.id === id)) {
      throw new Error(`Report with id ${id} not found`)
    }
    this.reports = this.reports.map((report) => (report.id === id ? { ...report, status } : report))
  }
}
