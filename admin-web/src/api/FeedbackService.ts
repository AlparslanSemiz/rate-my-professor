import { apiClient, type ApiClient } from './ApiClient'
import { RemoteBackedService, delay } from './RemoteBackedService'
import { FeedbackRepository, type BugReport, type ReportStatus } from './FeedbackRepository'

export type { BugReport, ReportStatus, Severity } from './FeedbackRepository'

export class FeedbackService extends RemoteBackedService {
  private readonly repository = new FeedbackRepository()

  constructor(client: ApiClient) {
    super(client)
  }

  getReports(): Promise<BugReport[]> {
    return this.execute(
      () => this.client.get<BugReport[]>('/feedback'),
      async () => {
        await delay(400)
        return this.repository.getAll()
      }
    )
  }

  updateStatus(id: number, status: ReportStatus): Promise<void> {
    return this.execute(
      () => this.client.patch(`/feedback/${id}`, { status }),
      async () => {
        await delay(300)
        this.repository.setStatus(id, status)
      }
    )
  }
}

export const feedbackService = new FeedbackService(apiClient)
