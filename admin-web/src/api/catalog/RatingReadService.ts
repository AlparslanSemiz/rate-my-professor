import { expectArray, type BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'
import { toRating } from './ratingMapper'
import type { BackendRating, RatingPage, RatingQuery } from './ratingTypes'

interface RatingsResponse extends BasicResponse {
  ratings: BackendRating[]
  nextCursor?: string | null
}

/** Reading pages of ratings. */
export class RatingReadService extends HttpService {
  /**
   * @param query the lecture to narrow to, and the cursor
   * @returns the page, each rating flattened by `toRating`
   * @throws {ContractError} when the response holds no `ratings` list
   */
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
