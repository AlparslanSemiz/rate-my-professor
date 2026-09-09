import type { BasicResponse, HttpTransport } from '@/api/client/ApiClient'
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

  protected constructor(client: HttpTransport, resource: string) {
    super(client)
    this.content = new ContentService<TItem>(client, resource)
    this.reports = new ReportsService<TReport>(client, resource)
  }

  /**
   * @returns every item of this resource — not only the reported ones, because moderating
   *          is not limited to what a student happened to flag
   * @throws {ContractError} when the response holds no list under the resource's name
   */
  getAll(): Promise<TItem[]> {
    return this.content.getAll()
  }

  /**
   * @param id the item to edit
   * @param update the text, the visibility, or both
   * @returns the envelope
   */
  update(id: string, update: ContentUpdate): Promise<BasicResponse> {
    return this.content.update(id, update)
  }

  /**
   * A real delete, not a hide.
   *
   * @param id the item to delete
   * @returns the envelope
   */
  delete(id: string): Promise<BasicResponse> {
    return this.content.delete(id)
  }

  /**
   * @returns the reports raised against this resource
   * @throws {ContractError} when the response holds no list under the resource's name
   */
  getReported(): Promise<TReport[]> {
    return this.reports.getReported()
  }

  /**
   * Moves a report along, which is also how content gets hidden.
   *
   * @param id the **report's** id, not the content's
   * @param status `ACTION_TAKEN` hides the content it is about; every other status restores it
   * @returns the envelope
   */
  updateStatus(id: string, status: ReportStatus): Promise<BasicResponse> {
    return this.reports.updateStatus(id, status)
  }

  /**
   * Withdraws a report and leaves the content exactly as it is.
   *
   * @param id the **report's** id, not the content's
   * @returns the envelope
   */
  deleteReport(id: string): Promise<BasicResponse> {
    return this.reports.deleteReport(id)
  }
}
