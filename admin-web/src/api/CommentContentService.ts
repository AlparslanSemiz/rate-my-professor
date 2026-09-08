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

  async getAll(): Promise<ManagedComment[]> {
    const response = await this.client.get<ManagedCommentsResponse>('/comments')
    return expectArray<ManagedComment>(response, 'comments', 'GET /comments')
  }

  update(id: string, update: ContentUpdate): Promise<BasicResponse> {
    return this.client.patch<BasicResponse>(`/comments/${id}`, update)
  }

  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/comments/${id}`)
  }
}
