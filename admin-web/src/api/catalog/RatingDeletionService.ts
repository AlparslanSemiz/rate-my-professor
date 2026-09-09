import type { BasicResponse } from '@/api/client/ApiClient'
import { HttpService } from '@/api/client/HttpService'

export class RatingDeletionService extends HttpService {
  /** Ratings can be removed but not edited: a rating is someone's actual opinion. */
  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/ratings/${id}`)
  }
}
