import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'

/**
 * Ratings can be removed but not edited: a rating is someone's actual opinion, so correcting
 * its scores would put words in their mouth.
 *
 * There is no panel screen for this yet, because the backend has no admin listing of
 * individual ratings — the public reads (`GET /ratings/{lectureId}`) return category averages
 * without rating ids, so there is nothing to take an id from. The call is here so a screen can
 * be built the moment such a listing exists.
 */
export class RatingsService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/ratings/${id}`)
  }
}

export const ratingsService = new RatingsService(apiClient)
