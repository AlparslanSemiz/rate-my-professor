import { expectArray, type HttpTransport, type BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { ReportStatus } from '@/domain/moderation'

/**
 * The reports raised against one kind of content, addressed separately from the content
 * itself. Parameterised the same way as `ContentService`: the resource names both the path
 * and the key the list arrives under, and `/reported` hangs off it.
 */
export class ReportsService<TReport> extends HttpService {
  private readonly resource: string

  constructor(client: HttpTransport, resource: string) {
    super(client)
    this.resource = resource
  }

  /**
   * @returns the reports raised against this resource
   * @throws {ContractError} when the response holds no list under the resource's name
   */
  async getReported(): Promise<TReport[]> {
    const path = `/${this.resource}/reported`
    const response = await this.client.get<BasicResponse>(path)
    return expectArray<TReport>(response, this.resource, `GET ${path}`)
  }

  /**
   * `ACTION_TAKEN` is the status that means the content was moderated, so it hides the
   * content; moving the report to any other status puts it back.
   */
  updateStatus(id: string, status: ReportStatus): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/${this.resource}/reported/${id}`, { status })
  }

  /** Withdraws the report. The content itself is left exactly as it is. */
  deleteReport(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/${this.resource}/reported/${id}`)
  }
}
