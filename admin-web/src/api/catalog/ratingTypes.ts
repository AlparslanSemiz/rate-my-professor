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

/** What `GET /ratings` accepts. Absent fields are not sent. */
export interface RatingQuery {
  limit?: number
  cursor?: string | null
  lectureId?: string
}

/** One page of ratings, with the cursor that fetches the next (see ADR 0006). */
export interface RatingPage {
  readonly ratings: readonly Rating[]
  nextCursor: string | null
}

/**
 * A rating as it arrives, before `toRating` flattens it.
 *
 * Almost everything is optional because almost nothing is promised: the author is nested and
 * may be absent, and `scores` may be null for a rating that scored nothing.
 */
export interface BackendRating {
  id: string
  lectureId?: string | null
  createdAt?: string
  author?: { id?: string; name?: string } | null
  scores?: Record<string, number> | null
}
