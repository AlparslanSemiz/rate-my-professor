import { apiClient, delay, type ApiClient } from './ApiClient'

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

export class FeedbackService {
  private reports: BugReport[] = []
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async getReports(): Promise<BugReport[]> {
    if (this.client.isConfigured) return this.client.get<BugReport[]>('/feedback')

    await delay(400)
    return [...this.reports]
  }

  async updateStatus(id: number, status: ReportStatus): Promise<void> {
    if (this.client.isConfigured) return this.client.patch(`/feedback/${id}`, { status })

    await delay(300)
    if (!this.reports.some((report) => report.id === id)) {
      throw new Error(`Report with id ${id} not found`)
    }
    this.reports = this.reports.map((report) => (report.id === id ? { ...report, status } : report))
  }
}

export const feedbackService = new FeedbackService(apiClient)
