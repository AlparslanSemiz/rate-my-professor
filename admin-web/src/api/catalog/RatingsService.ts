import { apiClient, type ApiClient, type BasicResponse } from './ApiClient'
import { RatingDeletionService } from './RatingDeletionService'
import { RatingReadService } from './RatingReadService'
import type { RatingPage, RatingQuery } from './ratingTypes'

export type { BackendRating, Rating, RatingPage, RatingQuery } from './ratingTypes'

export class RatingsService {
  private readonly reader: RatingReadService
  private readonly deletion: RatingDeletionService

  constructor(client: ApiClient) {
    this.reader = new RatingReadService(client)
    this.deletion = new RatingDeletionService(client)
  }

  async list(query: RatingQuery = {}): Promise<RatingPage> {
    return this.reader.list(query)
  }

  delete(id: string): Promise<BasicResponse> {
    return this.deletion.delete(id)
  }
}

export const ratingsService = new RatingsService(apiClient)
