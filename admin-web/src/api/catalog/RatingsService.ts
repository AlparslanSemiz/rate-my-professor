import { apiClient, type HttpTransport, type BasicResponse } from '@/api/client/ApiClient'
import { RatingDeletionService } from './RatingDeletionService'
import { RatingReadService } from './RatingReadService'
import type { RatingPage, RatingQuery } from './ratingTypes'

export type { BackendRating, Rating, RatingPage, RatingQuery } from './ratingTypes'

/**
 * Student ratings of lectures.
 *
 * Separate from `CatalogService` even though both live under the catalogue screen: ratings are
 * paged and the catalogue is not, so they have different read shapes and different caches.
 */
export class RatingsService {
  private readonly reader: RatingReadService
  private readonly deletion: RatingDeletionService

  constructor(client: HttpTransport) {
    this.reader = new RatingReadService(client)
    this.deletion = new RatingDeletionService(client)
  }

  /**
   * @param query the lecture to narrow to, and the cursor; omitted fields are not sent
   * @returns the page and the cursor for the next one, `null` on the last
   * @throws {ContractError} when the response holds no `ratings` list
   */
  async list(query: RatingQuery = {}): Promise<RatingPage> {
    return this.reader.list(query)
  }

  /**
   * Removes one rating. A rating is a student's own assessment, so this is not reversible.
   *
   * @param id the rating to delete
   * @returns the envelope
   */
  delete(id: string): Promise<BasicResponse> {
    return this.deletion.delete(id)
  }
}

/** The panel's ratings service, bound to the shared client. */
export const ratingsService = new RatingsService(apiClient)
