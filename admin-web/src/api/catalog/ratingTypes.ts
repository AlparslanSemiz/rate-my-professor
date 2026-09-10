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

/** One scored category, as the backend sends it: a name and a number, in a list. */
export interface BackendRatingTopic {
  category?: string
  value?: number
}

/**
 * A rating as it arrives, before `toRating` flattens it.
 *
 * Almost everything is optional because almost nothing is promised: the student is nested and
 * may be absent, and `topics` may be null for a rating that scored nothing.
 *
 * **`student` and `topics` are the backend's names.** They were `author` and `scores` here
 * until 2026-09-10 - names the panel invented, which the backend has never served. Both reads
 * were optional-chained with a fallback, so nothing failed: every row's author read "Unknown"
 * and every Scores cell read "-", against a real backend, quietly. `F-089`.
 */
export interface BackendRating {
  id: string
  lectureId?: string | null
  /** The lecture's own label, served beside the id. Not read yet; the panel joins on the id. */
  lectureLabel?: string | null
  createdAt?: string
  student?: { id?: string; name?: string } | null
  topics?: BackendRatingTopic[] | null
}
