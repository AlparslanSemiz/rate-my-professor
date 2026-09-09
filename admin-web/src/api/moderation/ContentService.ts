import { expectArray, type HttpTransport, type BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import type { ContentUpdate } from './contentTypes'

/**
 * Reads and edits one kind of moderated content.
 *
 * Comments and answers are the same three endpoints under a different noun, and the backend
 * names the list in the response body after the resource itself — `/comments` returns
 * `comments`, `/answers` returns `answers`. So one string is the whole difference between
 * them, and there is no second copy of this to keep in step.
 */
export class ContentService<TItem> extends HttpService {
  /** Both the path segment and the key the list arrives under. */
  private readonly resource: string

  constructor(client: HttpTransport, resource: string) {
    super(client)
    this.resource = resource
  }

  /** Everything the panel can moderate, not only what was reported. */
  async getAll(): Promise<TItem[]> {
    const path = `/${this.resource}`
    const response = await this.client.get<BasicResponse>(path)
    return expectArray<TItem>(response, this.resource, `GET ${path}`)
  }

  /** Edits the text or the visibility, independently of any report. */
  update(id: string, update: ContentUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/${this.resource}/${id}`, update)
  }

  /** A real delete, not a hide. What it takes with it depends on the resource. */
  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/${this.resource}/${id}`)
  }
}
