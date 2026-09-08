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
