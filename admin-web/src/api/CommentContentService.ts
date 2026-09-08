import { expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import type { ContentUpdate } from './contentTypes'
import type { ManagedComment } from './commentTypes'

interface ManagedCommentsResponse extends BasicResponse {
  comments: ManagedComment[]
}

export class CommentContentService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  /** Every comment the panel can moderate, not only reported comments. */
  async getAll(): Promise<ManagedComment[]> {
    const response = await this.client.get<ManagedCommentsResponse>('/comments')
    return expectArray<ManagedComment>(response, 'comments', 'GET /comments')
  }

  /** Edits the text or the visibility of a comment, independently of any report. */
  update(id: string, update: ContentUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/comments/${id}`, update)
  }

  /** Removes the comment and the thread under it. This is a real delete, not a hide. */
  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/comments/${id}`)
  }
}
