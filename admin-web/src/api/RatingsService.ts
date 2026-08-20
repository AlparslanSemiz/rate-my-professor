import { apiClient, expectArray, type ApiClient, type BasicResponse } from './ApiClient'

/**
 * One student's rating of one lecture.
 *
 * `scores` is read as an open map: which categories a rating carries depends on the lecture's
 * type, and the backend is free to add more without a frontend release. A rating whose shape
 * is missing a field renders as a dash rather than taking the screen down — the exact field
 * names are from the backend's brief and have not yet been read from a live response.
 */
export interface Rating {
  id: string
  lectureId: string | null
  authorName: string
  createdAt: string
  scores: Record<string, number>
}

export interface RatingQuery {
  limit?: number
  cursor?: string | null
  lectureId?: string
}

export interface RatingPage {
  ratings: Rating[]
  nextCursor: string | null
}

interface BackendRating {
  id: string
  lectureId?: string | null
  createdAt?: string
  author?: { id?: string; name?: string } | null
  scores?: Record<string, number> | null
}

interface RatingsResponse extends BasicResponse {
  ratings: BackendRating[]
  nextCursor?: string | null
}

const UNKNOWN_AUTHOR = 'Unknown'

function toRating(rating: BackendRating): Rating {
  return {
    id: rating.id,
    lectureId: rating.lectureId ?? null,
    authorName: rating.author?.name?.trim() || UNKNOWN_AUTHOR,
    createdAt: rating.createdAt ?? '',
    scores: rating.scores ?? {},
  }
}

/**
 * Ratings can be removed but not edited: a rating is someone's actual opinion, so correcting
 * its scores would put words in their mouth.
 */
export class RatingsService {
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

  delete(id: string): Promise<BasicResponse> {
    return this.client.delete<BasicResponse>(`/ratings/${id}`)
  }
}

export const ratingsService = new RatingsService(apiClient)
