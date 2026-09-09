/**
 * One student's rating of one lecture.
 *
 * `scores` is read as an open map: which categories a rating carries depends on the lecture's
 * type, and the backend is free to add more without a frontend release. A rating whose shape
 * is missing a field renders as a dash rather than taking the screen down.
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

export interface BackendRating {
  id: string
  lectureId?: string | null
  createdAt?: string
  author?: { id?: string; name?: string } | null
  scores?: Record<string, number> | null
}
