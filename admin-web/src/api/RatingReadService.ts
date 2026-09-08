import { expectArray, type ApiClient, type BasicResponse } from './ApiClient'
import { toRating } from './ratingMapper'
import type { BackendRating, RatingPage, RatingQuery } from './ratingTypes'

interface RatingsResponse extends BasicResponse {
  ratings: BackendRating[]
  nextCursor?: string | null
}

export class RatingReadService {
  private readonly client: ApiClient

  constructor(client: ApiClient) {
    this.client = client
  }

  async list(query: RatingQuery = {}): Promise<RatingPage> {
    const response = await this.client.get<RatingsResponse>('/ratings', {
      limit: query.limit,
      cursor: query.cursor,
      lectureId: query.lectureId,
    })
    return {
      ratings: expectArray<BackendRating>(response, 'ratings', 'GET /ratings').map(toRating),
      nextCursor: response.nextCursor ?? null,
    }
  }
}
