import { apiClient, type ApiClient } from './ApiClient'
import { RemoteBackedService, delay } from './RemoteBackedService'
import { CommentsRepository, type ReportedComment, type CommentReportStatus } from './CommentsRepository'

export type { ReportedComment, CommentReportStatus, ReportReason, CommentUserRef } from './CommentsRepository'

export class CommentsService extends RemoteBackedService {
  private readonly repository = new CommentsRepository()

  constructor(client: ApiClient) {
    super(client)
  }

  getReported(): Promise<ReportedComment[]> {
    return this.execute(
      () => this.client.get<ReportedComment[]>('/comments/reported'),
      async () => {
        await delay(400)
        return this.repository.getAll()
      }
    )
  }

  updateStatus(id: number, status: CommentReportStatus): Promise<void> {
    return this.execute(
      () => this.client.patch(`/comments/reported/${id}`, { status }),
      async () => {
        await delay(300)
        this.repository.setStatus(id, status)
      }
    )
  }
}

export const commentsService = new CommentsService(apiClient)
