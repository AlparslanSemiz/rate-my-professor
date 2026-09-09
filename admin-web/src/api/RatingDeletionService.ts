import type { ApiClient, BasicResponse } from './ApiClient'

export class RatingDeletionService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  /** Ratings can be removed but not edited: a rating is someone's actual opinion. */
  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/ratings/${id}`)
  }
}
