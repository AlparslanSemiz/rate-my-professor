import type { ApiClient, BasicResponse } from '@/api/client/ApiClient'
import { ContentService } from './ContentService'
import { HttpService } from '@/api/client/HttpService'
import { ReportsService } from './ReportsService'
import type { ContentUpdate } from './contentTypes'
import type { ReportStatus } from '@/domain/moderation'

/**
 * One moderated resource as a screen wants it: the content and the reports against it behind
 * a single object.
 *
 * The two halves stay separate classes because they are separate endpoint groups with
 * separate concerns; this is only the seam that lets a page hold one service instead of two.
 * `CommentsService` and `AnswersService` are this class with their nouns filled in.
 */
export abstract class ModerationService<TItem, TReport> extends HttpService {
  private readonly content: ContentService<TItem>
  private readonly reports: ReportsService<TReport>

  protected constructor(client: ApiClient, resource: string) {
    super(client)
    this.content = new ContentService<TItem>(client, resource)
    this.reports = new ReportsService<TReport>(client, resource)
  }

  getAll(): Promise<TItem[]> {
    return this.content.getAll()
  }

  update(id: string, update: ContentUpdate): Promise<BasicResponse> {
    return this.content.update(id, update)
  }

  delete(id: string): Promise<BasicResponse> {
    return this.content.delete(id)
  }

  getReported(): Promise<TReport[]> {
    return this.reports.getReported()
  }

  updateStatus(id: string, status: ReportStatus): Promise<BasicResponse> {
    return this.reports.updateStatus(id, status)
  }

  deleteReport(id: string): Promise<BasicResponse> {
    return this.reports.deleteReport(id)
  }
}
